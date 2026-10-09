/* Chess Coach: board, engine opponent, and move-by-move coaching.
   D002: Stockfish judges every move; Claude only explains the engine's output.
   D004: the coach stays quiet unless a move crosses the thresholds in COACH. */
(function () {
  'use strict';

  var GLYPH = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' };
  var NAME = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };
  var VAL = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  var FILES = 'abcdefgh';
  // skill: Stockfish "Skill Level" 0-20. depth: search depth. slip: chance of a random legal move.
  var LEVELS = {
    1: { skill: 0, depth: 1, slip: 0.35 },
    2: { skill: 0, depth: 2, slip: 0.15 },
    3: { skill: 5, depth: 5, slip: 0 },
    4: { skill: 12, depth: 9, slip: 0 },
    5: { skill: 20, depth: 14, slip: 0 }
  };
  // Coaching thresholds, in centipawns (100 = one pawn). Tune these from real games.
  var COACH = {
    mistake: 200,       // evaluation lost by the player's move to count as a mistake
    blunder: 400,       // ... to count as a blunder
    praiseSwing: 200,   // the opponent's last move lost at least this much ...
    praiseMaxLoss: 40,  // ... and the player's reply kept nearly all of it
    clamp: 1000,        // evaluations are capped at +/- this before comparing, so won or lost games stay quiet
    winning: 700,       // "clearly winning" for the end-of-game review
    depth: 12,
    movetime: 1000
  };
  var THEMES = ['hung piece', 'missed capture', 'missed threat', 'missed checkmate', 'allowed checkmate',
                'stalemate', 'tactic', 'king safety', 'opening principle', 'good capture', 'other'];
  var LABEL = { blunder: 'Blunder', mistake: 'Mistake', good: 'Well played' };
  var MARK = { blunder: '??', mistake: '?', good: '!' };
  var STORE_KEY = 'chess-coach-v1';

  var $ = function (id) { return document.getElementById(id); };
  var boardEl = $('board');

  var game = new Chess();
  var state = { side: 'w', level: 1, orientation: 'w', selected: null, targets: [], thinking: false, pendingPromo: null, resigned: false };
  var squares = {};
  var gen = 0;                 // bumped whenever the game is reset or a move is taken back
  var notes = [];              // coach comments: {ply, moveNo, san, label, theme, text, facts, pending, byClaude}
  var track = [];              // {ply, evalAfter} for each judged player move
  var review = { text: '', busy: false };
  var judge = { before: null, prevAfter: null };
  var resignArmed = false;
  var coach = { sample: null, perms: null, resolved: false, on: false, denied: false };

  /* ---------- engine ---------- */
  var Engine = {
    worker: null, ready: false, failed: false, cur: null, gen: 0, chain: Promise.resolve(), timer: null,
    init: function () {
      var self = this;
      try {
        this.worker = new Worker('vendor/stockfish.asm.js');
        this.worker.onmessage = function (e) { self.onLine(String(e.data)); };
        this.worker.onerror = function () { self.fail(); };
        this.worker.postMessage('uci');
        this.worker.postMessage('isready');
      } catch (err) { this.fail(); }
    },
    fail: function () {
      this.failed = true;
      engineNote('The engine did not load, so the opponent is playing random legal moves and there is no coaching.', true);
      clearTimeout(this.timer);
      if (this.cur) { var c = this.cur; this.cur = null; c.resolve(null); }
    },
    onLine: function (line) {
      if (line === 'readyok' && !this.ready) {
        this.ready = true;
        engineNote('Engine: Stockfish 10, running in this page.', false);
      }
      var c = this.cur;
      if (!c) return;
      if (line.indexOf('info ') === 0 && line.indexOf(' pv ') !== -1 && line.indexOf('bound') === -1) {
        var m = line.match(/ score (cp|mate) (-?\d+)/);
        var mp = line.match(/ multipv (\d+)/);
        if (m && (!mp || mp[1] === '1')) {
          c.info = { kind: m[1], value: Number(m[2]), pv: line.split(' pv ')[1].trim().split(/\s+/) };
        }
      } else if (line.indexOf('bestmove') === 0) {
        clearTimeout(this.timer);
        this.cur = null;
        var best = line.split(' ')[1];
        var out = { best: best && best !== '(none)' ? best : null, score: null, mate: null, pv: [] };
        if (c.info) {
          out.pv = c.info.pv;
          if (c.info.kind === 'cp') out.score = c.info.value;
          else { out.mate = c.info.value; out.score = c.info.value > 0 ? 10000 - c.info.value * 10 : -10000 - c.info.value * 10; }
        }
        c.resolve(out);
      }
    },
    cancel: function () {
      this.gen++;
      if (this.cur && this.worker) this.worker.postMessage('stop');
    },
    // Searches run one at a time, in the order they were asked for.
    search: function (fen, opt) {
      var self = this, myGen = this.gen;
      var p = this.chain.then(function () {
        return new Promise(function (resolve) {
          if (self.failed || myGen !== self.gen) { resolve(null); return; }
          self.cur = { resolve: resolve, info: null };
          self.worker.postMessage('setoption name Skill Level value ' + opt.skill);
          self.worker.postMessage('position fen ' + fen);
          self.worker.postMessage('go depth ' + opt.depth + ' movetime ' + opt.movetime);
          self.timer = setTimeout(function () { if (self.cur && self.cur.resolve === resolve) self.fail(); }, 20000);
        });
      });
      this.chain = p.then(function () {}, function () {});
      return p;
    },
    analyse: function (fen) { return this.search(fen, { skill: 20, depth: COACH.depth, movetime: COACH.movetime }); }
  };

  function engineNote(text, bad) {
    var el = $('engine-note');
    el.textContent = text;
    el.classList.toggle('bad', !!bad);
  }

  /* ---------- board ---------- */
  function buildBoard() {
    boardEl.textContent = '';
    squares = {};
    for (var r = 0; r < 8; r++) {
      for (var f = 0; f < 8; f++) {
        var rank = state.orientation === 'w' ? 8 - r : r + 1;
        var file = state.orientation === 'w' ? f : 7 - f;
        var name = FILES[file] + rank;
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'sq ' + ((file + rank) % 2 === 1 ? 'dark' : 'light');
        b.dataset.square = name;
        if (f === 0) b.appendChild(coord('rank', String(rank)));
        if (r === 7) b.appendChild(coord('file', FILES[file]));
        var p = document.createElement('span');
        p.className = 'piece';
        b.appendChild(p);
        boardEl.appendChild(b);
        squares[name] = b;
      }
    }
  }
  function coord(kind, text) {
    var s = document.createElement('span');
    s.className = 'coord ' + kind;
    s.textContent = text;
    s.setAttribute('aria-hidden', 'true');
    return s;
  }
  function pieceSpan(type, color) {
    var s = document.createElement('span');
    s.className = 'piece ' + color;
    s.textContent = GLYPH[type] + '︎';
    return s;
  }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function isOver() { return state.resigned || game.game_over(); }
  function lastMove() { var h = game.history({ verbose: true }); return h.length ? h[h.length - 1] : null; }
  function kingSquare(color) {
    for (var name in squares) { var p = game.get(name); if (p && p.type === 'k' && p.color === color) return name; }
    return null;
  }

  function render() {
    var lm = lastMove();
    var checkSq = game.in_check() ? kingSquare(game.turn()) : null;
    for (var name in squares) {
      var sq = squares[name];
      var p = game.get(name);
      var span = sq.querySelector('.piece');
      span.className = 'piece' + (p ? ' ' + p.color : '');
      span.textContent = p ? GLYPH[p.type] + '︎' : '';
      sq.classList.toggle('last', !!lm && (lm.from === name || lm.to === name));
      sq.classList.toggle('sel', state.selected === name);
      sq.classList.toggle('check', checkSq === name);
      var isTarget = state.targets.indexOf(name) !== -1;
      sq.classList.toggle('target', isTarget);
      sq.classList.toggle('occupied', isTarget && !!p);
      sq.setAttribute('aria-label', name + (p ? ', ' + (p.color === 'w' ? 'white ' : 'black ') + NAME[p.type] : ', empty'));
    }
    renderStatus();
    renderSheet();
    renderSeats();
    renderCoach();
    $('undo').disabled = game.history().length === 0 || (state.side === 'b' && game.history().length < 2 && !state.thinking && game.turn() === 'b');
    var rb = $('resign');
    rb.disabled = isOver() || game.history().length === 0;
    if (rb.disabled) { resignArmed = false; rb.textContent = 'Resign'; }
    $('side-hint').hidden = !(game.history().length > 0 && $('side').value !== state.side);
    save();
  }

  function renderSeats() {
    var youBottom = state.orientation === state.side;
    var levelText = 'Engine · level ' + state.level;
    var youText = 'You · ' + (state.side === 'w' ? 'White' : 'Black');
    $('seat-top').textContent = youBottom ? levelText : youText;
    $('seat-bottom').textContent = youBottom ? youText : levelText;
    var thinking = state.thinking ? 'thinking…' : '';
    $('seat-top-note').textContent = youBottom ? thinking : '';
    $('seat-bottom-note').textContent = youBottom ? '' : thinking;
  }

  function renderStatus() {
    var main, sub = '';
    var yours = game.turn() === state.side;
    if (state.resigned) {
      main = 'You resigned. The engine won.';
      sub = 'Start a new game, or take back to play on from here.';
    } else if (game.in_checkmate()) {
      main = yours ? 'Checkmate. The engine won.' : 'Checkmate. You won.';
      sub = 'Start a new game, or take back to try another line.';
    } else if (game.in_stalemate()) {
      main = 'Stalemate. The game is drawn.';
      sub = (yours ? 'You have' : 'The engine has') + ' no legal move and is not in check.';
    } else if (game.insufficient_material()) {
      main = 'Draw. Neither side can checkmate.';
      sub = 'There is not enough material left on the board.';
    } else if (game.in_threefold_repetition()) {
      main = 'Draw by repetition.';
      sub = 'The same position has come up three times.';
    } else if (game.in_draw()) {
      main = 'Draw by the fifty-move rule.';
      sub = 'Fifty moves passed with no capture and no pawn move.';
    } else if (state.thinking) {
      main = 'The engine is thinking…';
      sub = game.in_check() ? 'The engine is in check.' : '';
    } else if (yours) {
      main = game.in_check() ? 'You are in check' : 'Your move';
      sub = game.history().length === 0
        ? 'You have the ' + (state.side === 'w' ? 'white' : 'black') + ' pieces. Select a piece, then a marked square.'
        : (game.in_check() ? 'Move the king, block the check, or capture the checking piece.' : '');
    } else {
      main = 'Waiting for the engine';
    }
    $('status-main').textContent = main;
    $('status-sub').textContent = sub;
    $('status').classList.toggle('over', isOver());
  }

  function markFor(ply) {
    for (var i = 0; i < notes.length; i++) if (notes[i].ply === ply) return MARK[notes[i].label] || '';
    return '';
  }

  function renderSheet() {
    var body = $('sheet-body');
    var h = game.history();
    body.textContent = '';
    if (!h.length) {
      body.appendChild(el('p', 'empty', 'Moves appear here as you play, in standard notation.'));
    } else {
      var t = document.createElement('table');
      for (var i = 0; i < h.length; i += 2) {
        var tr = document.createElement('tr');
        tr.appendChild(el('td', 'no', (i / 2 + 1) + '.'));
        for (var k = 0; k < 2; k++) {
          var td = el('td', i + k === h.length - 1 ? 'cur' : '', h[i + k] || '');
          var mk = h[i + k] ? markFor(i + k) : '';
          if (mk) td.appendChild(el('span', 'mark', mk));
          tr.appendChild(td);
        }
        t.appendChild(tr);
      }
      body.appendChild(t);
      body.scrollTop = body.scrollHeight;
    }
    var out = $('pgn-out');
    if (!out.hidden) out.value = pgnText();
  }

  function drawReason() {
    if (game.in_stalemate()) return 'stalemate: the opponent has no legal move and is not in check';
    if (game.insufficient_material()) return 'insufficient material: neither side has enough pieces left to checkmate';
    if (game.in_threefold_repetition()) return 'threefold repetition: the same position came up three times';
    return 'the fifty-move rule';
  }
  function resultText() {
    if (state.resigned) return state.side === 'w' ? '0-1' : '1-0';
    if (game.in_checkmate()) return game.turn() === 'w' ? '0-1' : '1-0';
    return isOver() ? '1/2-1/2' : '*';
  }
  function pgnText() {
    var result = resultText();
    var moves = game.pgn({ max_width: 72 });
    return '[White "' + (state.side === 'w' ? 'You' : 'Stockfish level ' + state.level) + '"]\n' +
           '[Black "' + (state.side === 'b' ? 'You' : 'Stockfish level ' + state.level) + '"]\n' +
           '[Result "' + result + '"]\n\n' + (moves ? moves + ' ' : '') + result;
  }

  /* ---------- coach: facts from the engine ---------- */
  function clampCp(v) { return Math.max(-COACH.clamp, Math.min(COACH.clamp, v)); }
  function fmtEval(v) {
    if (Math.abs(v) >= 9000) return v > 0 ? 'forced mate for you' : 'forced mate against you';
    var p = (v / 100).toFixed(1);
    return (v > 0 ? '+' : v < 0 ? '−' : '') + p.replace('-', '');
  }
  function material(ch, color) {
    var s = 0;
    ch.board().forEach(function (row) { row.forEach(function (p) { if (p) s += (p.color === color ? 1 : -1) * VAL[p.type]; }); });
    return s;
  }
  // Plays a line of engine moves from a position. Returns the moves in SAN and the final position.
  function playLine(fen, uciMoves, max) {
    var c = new Chess(fen), sans = [];
    for (var i = 0; i < uciMoves.length && i < max; i++) {
      var u = uciMoves[i];
      var m = c.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u.length > 4 ? u[4] : undefined });
      if (!m) break;
      sans.push(m.san);
    }
    return { sans: sans, chess: c };
  }
  function pieceList(ch) {
    var out = { w: [], b: [] };
    var order = 'kqrbnp';
    ch.board().forEach(function (row, r) {
      row.forEach(function (p, f) { if (p) out[p.color].push({ t: p.type, sq: FILES[f] + (8 - r) }); });
    });
    function fmt(list) {
      return list.sort(function (a, b) { return order.indexOf(a.t) - order.indexOf(b.t); })
        .map(function (x) { return NAME[x.t] + ' ' + x.sq; }).join(', ');
    }
    return 'White: ' + fmt(out.w) + '\nBlack: ' + fmt(out.b);
  }
  function standing(cp) {
    if (cp >= 9000) return 'a forced checkmate for the player';
    if (cp <= -9000) return 'a forced checkmate against the player';
    if (cp >= 300) return 'clearly winning for the player';
    if (cp >= 100) return 'somewhat better for the player';
    if (cp > -100) return 'roughly level';
    if (cp > -300) return 'somewhat worse for the player';
    return 'clearly losing for the player';
  }
  function points(n) { return n + (n === 1 ? ' point' : ' points'); }

  function assess(d) {
    if (!d.before || !d.after || d.before.score === null || d.after.score === null) return;
    var rawBefore = d.before.score, rawAfter = -d.after.score;
    var b = clampCp(rawBefore), a = clampCp(rawAfter);
    var loss = b - a;
    var oppLoss = judge.prevAfter === null ? 0 : b - judge.prevAfter;
    judge.prevAfter = a;
    track.push({ ply: d.ply, evalAfter: rawAfter });

    var playedUci = d.move.from + d.move.to + (d.move.promotion || '');
    var label = null;
    if (playedUci !== d.before.best) {
      if (loss >= COACH.blunder) label = 'blunder';
      else if (loss >= COACH.mistake) label = 'mistake';
    }
    if (!label && oppLoss >= COACH.praiseSwing && loss <= COACH.praiseMaxLoss) label = 'good';
    if (!label) { save(); return; }

    var side = state.side;
    var bestLine = playLine(d.fenBefore, d.before.pv.length ? d.before.pv : [d.before.best], 8);
    var replyLine = playLine(d.fenAfter, d.after.pv.length ? d.after.pv : (d.after.best ? [d.after.best] : []), 8);
    var matBefore = material(new Chess(d.fenBefore), side);
    var matReply = material(replyLine.chess, side) - matBefore;
    var matBest = material(bestLine.chess, side) - matBefore;
    var drawn = d.after.drawn || '';
    // Each capture the opponent could make, with whether the player could take back. Without that
    // second fact Claude reads every legal capture as a threat (it called a defended pawn "unprotected").
    var captures = new Chess(d.fenAfter).moves({ verbose: true })
      .filter(function (m) { return m.captured; })
      .map(function (m) {
        var c = new Chess(d.fenAfter);
        c.move(m);
        var back = c.moves({ verbose: true }).some(function (x) { return x.to === m.to && x.captured; });
        return m.san + ' (' + NAME[m.piece] + ' takes ' + NAME[m.captured] + '; ' +
          (back ? 'the player can take back, so this is not a free capture' : 'the player cannot take back') + ')';
      });
    var threat = drawn ? null : replyThreats(d.fenAfter, d.after.pv.length ? d.after.pv[0] : d.after.best);

    var facts = {
      best: bestLine.sans[0] || '',
      bestLine: bestLine.sans.slice(0, 4).join(' '),
      replyLine: replyLine.sans.slice(0, 5).join(' '),
      evalBefore: rawBefore, evalAfter: rawAfter,
      matReply: matReply, matBest: matBest, drawn: drawn
    };

    var text;
    if (label === 'good') {
      text = 'Your opponent\'s last move was a mistake and ' + d.move.san + ' took advantage of it.';
    } else if (drawn) {
      text = d.move.san + ' ended the game in a draw by ' + drawn + '. You were winning, and the engine preferred ' + facts.best + '.';
    } else {
      text = 'The engine preferred ' + facts.best + '. After ' + d.move.san + ' it expects ' + facts.replyLine +
        (matReply < 0 ? ', which leaves you down about ' + points(-matReply) + ' of material' : '') + '.';
    }

    var note = {
      ply: d.ply, moveNo: Math.floor(d.ply / 2) + 1, san: d.move.san, label: label, theme: null,
      text: text, facts: facts, pending: false, byClaude: false, error: ''
    };
    notes.push(note);

    if (coach.on && coach.sample) {
      note.pending = true;
      var colour = side === 'w' ? 'White' : 'Black';
      var lines = [
        'You are a chess coach for a beginner rated about 500-600 on chess.com.',
        'A chess engine has already judged the move. Every fact below comes from the engine or from the rules of chess.',
        'Do not calculate, and do not mention any move, threat or variation that is not listed below. If the facts do not show why, say only what they do show.',
        '',
        'The player has the ' + colour + ' pieces. This was move ' + note.moveNo + '.',
        'Verdict: ' + (label === 'good' ? 'good move, it punished the opponent\'s mistake' : label) + '.',
        'Engine evaluation from the player\'s side, in pawns: ' + fmtEval(rawBefore) + ' before the move, ' + fmtEval(rawAfter) + ' after it.',
        'Overall, after the player\'s move the engine rates the position as ' + standing(rawAfter) + '.',
        'Pieces on the board before the move:',
        pieceList(new Chess(d.fenBefore)),
        'Position before the move (FEN): ' + d.fenBefore,
        'The player\'s move: ' + d.move.san + (d.move.captured ? ' (captures a ' + NAME[d.move.captured] + ')' : ''),
        'The engine\'s preferred move: ' + facts.best + '. Its expected line: ' + facts.bestLine + '.',
        drawn
          ? 'The player\'s move ended the game at once in a draw by ' + drawn + '. The player threw away a winning position.'
          : 'The engine\'s expected line after the player\'s move, starting with the opponent\'s reply: ' + facts.replyLine + '.'
      ];
      if (!drawn) {
        lines.push('Material count for the player compared with before the move (pawn 1, knight or bishop 3, rook 5, queen 9; approximate, taken at the end of each line): ' +
          (matReply >= 0 ? '+' : '') + matReply + ' after the line that follows the player\'s move, ' + (matBest >= 0 ? '+' : '') + matBest + ' after the engine\'s preferred line.');
        var total = material(replyLine.chess, side);
        lines.push('Total material on the board at the end of the line that follows the player\'s move: the player is ' +
          (total > 0 ? 'ahead by ' + points(total) : total < 0 ? 'behind by ' + points(-total) : 'level') + '.');
        lines.push('Say the player is ahead, behind, winning or losing only as these two overall facts state. A move can win material while the player is still behind overall.');
        if (threat) {
          lines.push('After the opponent\'s reply ' + threat.san + ', the piece that just moved attacks: ' +
            (threat.list.length ? threat.list.join(', ') : 'none of the player\'s pieces') + '.');
        }
        lines.push('Every capture the opponent could legally make right after the player\'s move, whether or not it is any good: ' + (captures.length ? captures.join(', ') : 'none') + '.');
        lines.push('Only describe a capture as a problem if the player cannot take back or it is the first move of the engine\'s line. Never call a piece or pawn unprotected, hanging or free unless a fact above says so.');
      }
      if (d.after.mate !== null && d.after.mate > 0) lines.push('The player\'s move allows a forced checkmate in ' + d.after.mate + '.');
      if (d.before.mate !== null && d.before.mate > 0 && label !== 'good') lines.push('The player had a forced checkmate in ' + d.before.mate + ' starting with ' + facts.best + ' and missed it.');
      lines.push('',
        'Reply with only a JSON object: {"comment": string, "theme": string}.',
        'comment: at most three short sentences and under 60 words, in plain words, spoken to the player as "you". Say what went wrong or right, naming the pieces and squares from the facts above, then give one habit to apply next time. No evaluation numbers. No markdown.',
        'theme: exactly one of: ' + THEMES.join(', ') + '.');
      var myGen = gen;
      Promise.resolve().then(function () {
        return coach.sample(lines.join('\n'), { modelTier: 'default' });
      }).then(function (res) {
        var r = parseReply(res && res.text);
        if (r.comment) {
          note.text = r.comment;
          note.byClaude = true;
          if (THEMES.indexOf(r.theme) !== -1) note.theme = r.theme;
        } else {
          note.error = 'empty reply';
        }
      }, function (err) {
        note.error = (err && (err.code || err.message)) || 'unknown error';
        if (err && err.code === 'not_granted') { coach.on = false; coach.denied = true; }
      }).then(function () {
        note.pending = false;
        if (myGen === gen || notes.indexOf(note) !== -1) { renderCoach(); renderSheet(); save(); }
      });
    }
    renderCoach();
    renderSheet();
    save();
  }

  // What the opponent's replying piece attacks once it has moved, and whether each target is defended.
  function replyThreats(fenAfter, uci) {
    if (!uci) return null;
    var c = new Chess(fenAfter);
    var m = c.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.length > 4 ? uci[4] : undefined });
    if (!m) return null;
    var parts = c.fen().split(' ');
    parts[1] = parts[1] === 'w' ? 'b' : 'w';   // give the opponent a second move to see what the piece attacks
    parts[3] = '-';
    var f = new Chess(), list = [];
    if (f.load(parts.join(' '))) {
      list = f.moves({ square: m.to, verbose: true })
        .filter(function (x) { return x.captured && x.captured !== 'k'; })
        .map(function (x) {
          var g = new Chess(f.fen());
          g.move(x);
          var def = g.moves({ verbose: true }).some(function (y) { return y.to === x.to && y.captured; });
          return 'the player\'s ' + NAME[x.captured] + ' on ' + x.to + ' (' + (def ? 'defended' : 'not defended') + ')';
        });
    }
    return { san: m.san, list: list };
  }

  // Reads Claude's reply as {"comment", "theme"}; if it is not JSON, the whole reply is the comment.
  function parseReply(text) {
    var t = String(text || '').trim();
    if (!t) return { comment: '', theme: '' };
    var m = t.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        var o = JSON.parse(m[0]);
        if (o && typeof o.comment === 'string') return { comment: o.comment.trim(), theme: typeof o.theme === 'string' ? o.theme.trim().toLowerCase() : '' };
      } catch (e) { /* fall through to plain text */ }
    }
    return { comment: t.replace(/^```\w*|```$/g, '').trim(), theme: '' };
  }

  /* ---------- coach: panel ---------- */
  function renderCoach() {
    var gate = $('coach-gate'), log = $('coach-log'), stateEl = $('coach-state');
    var available = coach.resolved && !!coach.sample && !coach.denied;
    gate.hidden = !(available && !coach.on);
    if (!coach.resolved) stateEl.textContent = 'Checking…';
    else if (coach.on) stateEl.textContent = 'On · explained by Claude';
    else if (available) stateEl.textContent = 'Off · engine verdicts only';
    else stateEl.textContent = 'Engine verdicts only';

    log.textContent = '';
    if (!notes.length) {
      var msg = 'No comments yet. The coach stays quiet unless a move is worth talking about.';
      if (coach.resolved && !available) {
        msg = (coach.denied ? 'Claude\'s commentary is switched off for this page.' : 'Claude\'s commentary is not available in this view.') +
          ' You still get the engine\'s verdict when a move is worth flagging.';
      }
      log.appendChild(el('p', 'coach-empty', msg));
    }
    for (var i = notes.length - 1; i >= 0; i--) {
      var n = notes[i];
      var card = el('div', 'note ' + n.label);
      var head = el('div', 'note-head');
      head.appendChild(el('span', 'note-move', n.moveNo + (n.ply % 2 === 0 ? '. ' : '… ') + n.san));
      head.appendChild(el('span', 'note-label', LABEL[n.label] + (n.theme ? ' · ' + n.theme : '')));
      card.appendChild(head);
      card.appendChild(el('p', 'note-text' + (n.pending ? ' pending' : ''), n.pending ? 'The coach is writing…' : n.text));
      var f = n.facts;
      var factText = n.label === 'good'
        ? 'Evaluation ' + fmtEval(f.evalBefore) + ' → ' + fmtEval(f.evalAfter)
        : 'Engine preferred ' + f.best + ' · evaluation ' + fmtEval(f.evalBefore) + ' → ' + fmtEval(f.evalAfter);
      if (n.error) factText += ' · Claude did not answer (' + n.error + '), so this is the engine\'s verdict';
      card.appendChild(el('p', 'note-facts', factText));
      log.appendChild(card);
    }

    var rv = $('review'), btn = $('review-btn'), txt = $('review-text');
    rv.hidden = !isOver();
    if (isOver()) {
      txt.textContent = review.text || (localReview() + (review.error ? ' Claude did not answer (' + review.error + ').' : ''));
      btn.hidden = !(coach.on && coach.sample) || review.busy || !!review.byClaude;
    }
  }

  function gameStats() {
    var counts = { blunder: 0, mistake: 0, good: 0 }, themes = {};
    notes.forEach(function (n) { counts[n.label]++; if (n.theme) themes[n.theme] = (themes[n.theme] || 0) + 1; });
    var winMove = null;
    for (var i = 0; i < track.length; i++) {
      if (track[i].evalAfter >= COACH.winning) { winMove = Math.floor(track[i].ply / 2) + 1; break; }
    }
    return { counts: counts, themes: themes, winMove: winMove, lastMove: Math.ceil(game.history().length / 2) };
  }
  function localReview() {
    var s = gameStats();
    var parts = [s.counts.blunder + (s.counts.blunder === 1 ? ' blunder' : ' blunders') + ', ' +
      s.counts.mistake + (s.counts.mistake === 1 ? ' mistake' : ' mistakes') + ', ' +
      s.counts.good + (s.counts.good === 1 ? ' punished mistake' : ' punished mistakes') + ' in ' + s.lastMove + ' moves.'];
    if (s.winMove !== null) parts.push('The engine had you clearly winning from move ' + s.winMove + '.');
    return parts.join(' ');
  }

  function askReview() {
    if (!coach.sample || review.busy) return;
    var s = gameStats();
    var yours = game.turn() === state.side;
    var outcome = state.resigned ? 'The player resigned.' : game.in_checkmate() ? (yours ? 'The player was checkmated.' : 'The player won by checkmate.') : 'The game was drawn (' + $('status-main').textContent + ').';
    var lines = [
      'You are a chess coach for a beginner rated about 500-600 on chess.com. Write a short review of the game they just played against a computer opponent.',
      'A chess engine judged every move. Use only the facts below. Do not invent moves, positions or variations.',
      '',
      'The player had the ' + (state.side === 'w' ? 'White' : 'Black') + ' pieces. ' + outcome + ' The game lasted ' + s.lastMove + ' moves.',
      'Flagged moves: ' + s.counts.blunder + ' blunders, ' + s.counts.mistake + ' mistakes, ' + s.counts.good + ' times the player punished an opponent mistake.',
      s.winMove !== null
        ? 'The engine first rated the player clearly winning (ahead by 7 pawns or more) after move ' + s.winMove + '. The game ended on move ' + s.lastMove + '.'
        : 'The engine never rated the player clearly winning (ahead by 7 pawns or more).',
      'The flagged moments, in order:'
    ];
    if (!notes.length) lines.push('(none)');
    notes.forEach(function (n) {
      lines.push('- Move ' + n.moveNo + ', ' + n.san + ': ' + LABEL[n.label] + (n.theme ? ' (' + n.theme + ')' : '') + '. ' + n.text);
    });
    lines.push('',
      'Write three to five short sentences in plain words, spoken to the player as "you". Name any pattern that came up more than once. If the player was clearly winning for many moves before the game ended, say that converting a won position faster is worth practising. End with one specific thing to practise next game. No markdown, no lists, no evaluation numbers.');
    review.busy = true;
    review.error = '';
    review.text = 'The coach is writing…';
    renderCoach();
    var myGen = gen;
    coach.sample(lines.join('\n'), {
      modelTier: 'default',
      onText: function (u) { if (myGen === gen) { review.text = u.text; $('review-text').textContent = u.text; } }
    }).then(function (r) {
      if (myGen !== gen) return;
      review.text = (r.text || '').trim();
      review.byClaude = true;
    }, function (err) {
      if (myGen !== gen) return;
      review.text = '';
      review.error = (err && (err.code || err.message)) || 'unknown error';
      if (err && err.code === 'not_granted') { coach.on = false; coach.denied = true; }
    }).then(function () {
      review.busy = false;
      if (myGen === gen) { renderCoach(); save(); }
    });
  }

  function initCoach() {
    var c = window.claude;
    if (!c || !c.use) { coach.resolved = true; renderCoach(); return; }
    Promise.all([c.use('sample'), c.use('permissions')]).then(function (r) {
      coach.sample = r[0]; coach.perms = r[1];
      if (!coach.sample) return null;
      var wanted = false;
      try { wanted = localStorage.getItem(STORE_KEY + '-coach') === 'on'; } catch (e) { /* optional */ }
      if (!coach.perms) { coach.on = wanted; return null; }
      return coach.perms.state('sample').then(function (st) {
        if (st === 'denied' || st === 'unavailable') { coach.denied = st === 'denied'; if (st === 'unavailable') coach.sample = null; }
        else if (st === 'granted' && wanted) coach.on = true;
      });
    }).then(null, function () { coach.sample = null; }).then(function () {
      coach.resolved = true;
      renderCoach();
    });
  }

  function turnOnCoach() {
    var btn = $('coach-on');
    btn.disabled = true;
    var ask = coach.perms ? coach.perms.request(['sample']) : Promise.resolve({ sample: 'granted' });
    ask.then(function (res) {
      var st = res && res.sample;
      if (st === 'denied') coach.denied = true;
      else if (st === 'unavailable') coach.sample = null;
      else coach.on = true;
      try { localStorage.setItem(STORE_KEY + '-coach', coach.on ? 'on' : 'off'); } catch (e) { /* optional */ }
    }, function () {}).then(function () { btn.disabled = false; renderCoach(); });
  }

  /* ---------- play ---------- */
  function clearSelection() { state.selected = null; state.targets = []; }

  function startPlayerTurn() {
    judge.before = isOver() ? Promise.resolve(null) : Engine.analyse(game.fen());
  }

  function onSquare(name) {
    if (state.thinking || isOver() || game.turn() !== state.side || state.pendingPromo) return;
    if (state.selected && state.targets.indexOf(name) !== -1) {
      var moves = game.moves({ square: state.selected, verbose: true }).filter(function (m) { return m.to === name; });
      if (moves.length && moves[0].flags.indexOf('p') !== -1) { askPromotion(state.selected, name); return; }
      playerMove({ from: state.selected, to: name });
      return;
    }
    var p = game.get(name);
    if (p && p.color === state.side && state.selected !== name) {
      state.selected = name;
      state.targets = game.moves({ square: name, verbose: true }).map(function (m) { return m.to; });
    } else {
      clearSelection();
    }
    render();
  }

  function playerMove(mv) {
    var fenBefore = game.fen(), ply = game.history().length, beforeP = judge.before || Promise.resolve(null);
    var done = game.move(mv);
    clearSelection();
    if (!done) { render(); return; }
    var fenAfter = game.fen(), myGen = gen, ended = isOver();
    if (ended && game.in_checkmate()) { render(); return; }
    // A move that ends the game in a draw is judged as leaving a level position.
    var afterP = ended
      ? Promise.resolve({ best: null, score: 0, mate: null, pv: [], drawn: drawReason() })
      : Engine.analyse(fenAfter);
    Promise.all([beforeP, afterP]).then(function (r) {
      if (myGen !== gen) return;
      assess({ ply: ply, fenBefore: fenBefore, fenAfter: fenAfter, move: done, before: r[0], after: r[1] });
    });
    if (ended) render(); else engineTurn();
  }

  function askPromotion(from, to) {
    state.pendingPromo = { from: from, to: to };
    var row = $('promo-row');
    row.textContent = '';
    ['q', 'r', 'b', 'n'].forEach(function (t) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', NAME[t]);
      b.appendChild(pieceSpan(t, state.side));
      b.addEventListener('click', function () {
        var pp = state.pendingPromo;
        closePromotion();
        playerMove({ from: pp.from, to: pp.to, promotion: t });
      });
      row.appendChild(b);
    });
    $('promo').hidden = false;
    row.firstChild.focus();
  }
  function closePromotion() { state.pendingPromo = null; $('promo').hidden = true; }

  function randomMove() {
    var ms = game.moves({ verbose: true });
    return ms[Math.floor(Math.random() * ms.length)];
  }

  function engineTurn() {
    var myGen = gen;
    var cfg = LEVELS[state.level];
    state.thinking = true;
    render();
    var started = Date.now();
    var pick = (Engine.failed || Math.random() < cfg.slip)
      ? Promise.resolve(null)
      : Engine.search(game.fen(), { skill: cfg.skill, depth: cfg.depth, movetime: 1500 });
    pick.then(function (res) {
      var wait = Math.max(0, 450 - (Date.now() - started));
      setTimeout(function () {
        if (myGen !== gen) return;
        var uci = res && res.best, done = null;
        if (uci && uci.length >= 4) {
          done = game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.length > 4 ? uci[4] : undefined });
        }
        if (!done) { var r = randomMove(); if (r) game.move(r); }
        state.thinking = false;
        startPlayerTurn();
        render();
      }, wait);
    });
  }

  function stopEngine() {
    gen++;
    Engine.cancel();
    state.thinking = false;
    state.resigned = false;
    judge.before = null;
    judge.prevAfter = null;
  }

  function trimToGame() {
    var len = game.history().length;
    notes = notes.filter(function (n) { return n.ply < len; });
    track = track.filter(function (t) { return t.ply < len; });
    review = { text: '', busy: false };
  }

  function newGame() {
    stopEngine();
    closePromotion();
    game.reset();
    trimToGame();
    state.side = $('side').value;
    state.orientation = state.side;
    clearSelection();
    buildBoard();
    if (state.side === 'b') engineTurn(); else { startPlayerTurn(); render(); }
  }

  function resign() {
    if (isOver() || !game.history().length) return;
    stopEngine();
    closePromotion();
    clearSelection();
    state.resigned = true;
    render();
  }

  function takeBack() {
    var wasResigned = state.resigned;
    stopEngine();
    closePromotion();
    clearSelection();
    if (wasResigned) {   // un-resign: carry on from the same position
      review = { text: '', busy: false };
      if (game.turn() !== state.side) engineTurn(); else { startPlayerTurn(); render(); }
      return;
    }
    if (!game.history().length) { render(); return; }
    game.undo();
    if (game.turn() !== state.side && game.history().length) game.undo();
    trimToGame();
    if (game.turn() !== state.side && !isOver()) engineTurn(); else { startPlayerTurn(); render(); }
  }

  /* ---------- persistence ---------- */
  function snapshot() {
    return {
      pgn: game.pgn(), side: state.side, level: state.level, orientation: state.orientation, resigned: state.resigned,
      notes: notes.map(function (n) { var c = {}; for (var k in n) c[k] = n[k]; c.pending = false; return c; }),
      track: track, review: review.byClaude ? review.text : ''
    };
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(snapshot())); } catch (e) { /* storage is optional */ }
  }
  function restore(data) {
    if (!data || typeof data !== 'object') return;
    if (data.side === 'w' || data.side === 'b') state.side = data.side;
    if (LEVELS[data.level]) state.level = Number(data.level);
    state.orientation = (data.orientation === 'w' || data.orientation === 'b') ? data.orientation : state.side;
    if (typeof data.pgn === 'string' && data.pgn) { if (!game.load_pgn(data.pgn)) game.reset(); }
    var len = game.history().length;
    state.resigned = data.resigned === true && len > 0 && !game.game_over();
    if (Array.isArray(data.notes)) {
      notes = data.notes.filter(function (n) { return n && typeof n.ply === 'number' && n.ply < len && LABEL[n.label] && n.facts && typeof n.text === 'string'; });
    }
    if (Array.isArray(data.track)) {
      track = data.track.filter(function (t) { return t && typeof t.ply === 'number' && t.ply < len && typeof t.evalAfter === 'number'; });
    }
    if (typeof data.review === 'string' && data.review) review = { text: data.review, busy: false, byClaude: true };
  }

  /* ---------- wiring ---------- */
  boardEl.addEventListener('click', function (e) {
    var b = e.target.closest('.sq');
    if (b) onSquare(b.dataset.square);
  });
  $('new-game').addEventListener('click', newGame);
  $('undo').addEventListener('click', takeBack);
  $('flip').addEventListener('click', function () {
    state.orientation = state.orientation === 'w' ? 'b' : 'w';
    buildBoard();
    render();
  });
  $('level').addEventListener('change', function () { state.level = Number(this.value); render(); });
  $('side').addEventListener('change', function () {
    if (game.history().length === 0) newGame(); else render();
  });
  $('promo-cancel').addEventListener('click', function () { closePromotion(); clearSelection(); render(); });
  // Resigning takes two clicks, so a stray click cannot end the game.
  $('resign').addEventListener('click', function () {
    var btn = this;
    if (resignArmed) { resignArmed = false; btn.textContent = 'Resign'; resign(); return; }
    resignArmed = true;
    btn.textContent = 'Confirm resign';
    setTimeout(function () { if (resignArmed) { resignArmed = false; btn.textContent = 'Resign'; } }, 4000);
  });
  $('coach-on').addEventListener('click', turnOnCoach);
  $('review-btn').addEventListener('click', askReview);
  $('copy-pgn').addEventListener('click', function () {
    var btn = this, text = pgnText(), out = $('pgn-out');
    function showBox() { out.hidden = false; out.value = text; out.focus(); out.select(); }
    try {
      navigator.clipboard.writeText(text).then(function () {
        btn.textContent = 'Copied';
        setTimeout(function () { btn.textContent = 'Copy PGN'; }, 1500);
      }, showBox);
    } catch (err) { showBox(); }
  });

  function start(data) {
    var saved = data && data.pgn !== undefined ? data : null;
    if (!saved) { try { saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch (e) { saved = null; } }
    restore(saved);
    $('side').value = state.side;
    $('level').value = String(state.level);
    Engine.init();
    buildBoard();
    initCoach();
    if (!isOver() && game.turn() !== state.side) engineTurn(); else { startPlayerTurn(); render(); }
  }

  var hot = window.claude && window.claude.hot;
  if (hot && hot.snapshot) hot.snapshot(snapshot);
  if (hot && hot.ready) hot.ready(start); else start((hot && hot.data) || {});
})();
