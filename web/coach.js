/* Chess Coach: board, engine opponent, and move-by-move coaching.
   D005: served locally from web/; the published artifact is an optional cloud build.
   D006: commentary comes from a local model by default, cloud Claude only in the artifact.
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
    stillWinning: 500,  // a mistake that leaves the player at least this far ahead is not flagged (D004: stay quiet)
    depth: 12,
    movetime: 1000
  };
  var LABEL = { blunder: 'Blunder', mistake: 'Mistake', good: 'Well played' };
  var MARK = { blunder: '??', mistake: '?', good: '!' };
  var BUILD = '2026-10-10.4';   // shown under the scoresheet, so a stale cached script is visible
  var STORE_KEY = 'chess-coach-v1';

  var $ = function (id) { return document.getElementById(id); };
  var boardEl = $('board');

  var game = new Chess();
  var state = { side: 'w', level: 1, orientation: 'w', selected: null, targets: [], thinking: false, pendingPromo: null, resigned: false };
  var squares = {};
  var gen = 0;                 // bumped whenever the game is reset or a move is taken back
  var notes = [];              // coach comments: {ply, moveNo, san, label, theme, text, facts, pending, byClaude}
  var track = [];              // {ply, evalAfter} for each judged player move
  var review = { text: '', busy: false, by: '', error: '' };
  var judge = { before: null, prevAfter: null };
  var resignArmed = false;
  var coach = { kind: '', resolved: false, on: false, problem: '', sample: null, perms: null };

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
        engineNote('Engine: Stockfish 10, running in this page. Build ' + BUILD + '.', false);
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

  // What the opponent's replying piece attacks once it has moved, and whether each target is defended.
  function replyThreats(fenAfter, uci) {
    if (!uci) return null;
    var c = new Chess(fenAfter);
    var m = c.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.length > 4 ? uci[4] : undefined });
    if (!m) return null;
    var parts = c.fen().split(' ');
    parts[1] = parts[1] === 'w' ? 'b' : 'w';   // give the opponent a second move to see what the piece attacks
    parts[3] = '-';
    var f = new Chess(), list = [], loose = false;
    if (f.load(parts.join(' '))) {
      list = f.moves({ square: m.to, verbose: true })
        .filter(function (x) { return x.captured && x.captured !== 'k'; })
        .map(function (x) {
          var g = new Chess(f.fen());
          g.move(x);
          var def = g.moves({ verbose: true }).some(function (y) { return y.to === x.to && y.captured; });
          if (!def) loose = true;
          return 'the player\'s ' + NAME[x.captured] + ' on ' + x.to + ' (' + (def ? 'defended' : 'not defended') + ')';
        });
    }
    return { san: m.san, list: list, loose: loose, captured: m.captured || '' };
  }

  // Every capture the side to move could make, with whether the other side could take back.
  function captureFacts(fen) {
    return new Chess(fen).moves({ verbose: true })
      .filter(function (m) { return m.captured; })
      .map(function (m) {
        var c = new Chess(fen);
        c.move(m);
        var back = c.moves({ verbose: true }).some(function (x) { return x.to === m.to && x.captured; });
        return { san: m.san, piece: m.piece, captured: m.captured, to: m.to, back: back, uci: m.from + m.to + (m.promotion || '') };
      });
  }

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
    if (label && rawAfter >= COACH.stillWinning) label = null;
    if (!label && oppLoss >= COACH.praiseSwing && loss <= COACH.praiseMaxLoss) label = 'good';
    if (!label) { save(); return; }

    // ---- facts, all computed here: the model is never asked to work anything out (D002, D006)
    var side = state.side;
    var drawn = d.after.drawn || '';
    var bestUci = d.before.pv.length ? d.before.pv[0] : d.before.best;
    var replyUci = d.after.pv.length ? d.after.pv[0] : d.after.best;
    var bestLine = playLine(d.fenBefore, d.before.pv.length ? d.before.pv : [d.before.best], 8);
    var replyLine = playLine(d.fenAfter, d.after.pv.length ? d.after.pv : (replyUci ? [replyUci] : []), 8);
    var matBefore = material(new Chess(d.fenBefore), side);
    var matReply = material(replyLine.chess, side) - matBefore;
    var matBest = material(bestLine.chess, side) - matBefore;
    var total = material(replyLine.chess, side);
    var oppCaps = drawn ? [] : captureFacts(d.fenAfter);
    var threat = drawn ? null : replyThreats(d.fenAfter, replyUci);
    var freeCaps = oppCaps.filter(function (c) { return !c.back; });
    var replyCap = oppCaps.filter(function (c) { return c.uci === replyUci; })[0] || null;
    // A piece that has just captured something and is taken back is a trade, not a hung piece,
    // unless it gave up clearly more than it took.
    var took = d.move.captured ? VAL[d.move.captured] : 0;
    function netLoss(c) { return VAL[c.captured] - (c.to === d.move.to ? took : 0); }
    var hung = freeCaps.filter(function (c) { return c.captured !== 'p' && netLoss(c) >= 2; });
    var trade = !!(d.move.captured && replyCap && replyCap.to === d.move.to && Math.abs(netLoss(replyCap)) < 2);
    if (replyCap && replyCap.captured !== 'p' && hung.indexOf(replyCap) === -1 && VAL[replyCap.captured] > VAL[replyCap.piece] && netLoss(replyCap) >= 2) hung.push(replyCap);
    var bestCap = captureFacts(d.fenBefore).filter(function (c) { return c.uci === bestUci; })[0] || null;
    var hadMate = d.before.mate !== null && d.before.mate > 0 && label !== 'good';
    var allowsMate = d.after.mate !== null && d.after.mate > 0;

    // A big lead that drops to dead level after a checking reply is almost always a forced draw by repeated checks.
    var slipped = !drawn && rawBefore >= 300 && Math.abs(rawAfter) <= 20 && (replyLine.sans[0] || '').indexOf('+') !== -1;
    var theme;
    if (label === 'good') theme = d.move.captured ? 'good capture' : 'good reply';
    else if (drawn) theme = drawn.indexOf('stalemate') === 0 ? 'stalemate' : 'drawn a won game';
    else if (hadMate) theme = 'missed checkmate';
    else if (allowsMate) theme = 'allowed checkmate';
    else if (hung.length) theme = 'hung piece';
    else if (slipped) theme = 'let a win slip';
    else if (threat && threat.loose) theme = 'missed threat';
    else if (bestCap) theme = 'missed capture';
    else if (trade) theme = 'trade';
    else theme = 'other';

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
      ply: d.ply, moveNo: Math.floor(d.ply / 2) + 1, san: d.move.san, label: label, theme: theme,
      text: text, facts: facts, pending: false, by: '', error: ''
    };
    notes.push(note);

    if (canExplain()) {
      note.pending = true;
      // Only the decisive fact goes to the model. A long fact sheet made the local model reason at
      // length and ramble; the reason for the verdict is chosen here, in code.
      var replySan = replyLine.sans[0] || '';
      var key;
      if (label === 'good') {
        key = 'the opponent\'s previous move was a mistake' + (d.move.captured ? ' that left the ' + NAME[d.move.captured] + ' on ' + d.move.to + ' where it could be taken' : '');
      } else if (drawn) {
        key = 'the move ended the game at once in a draw by ' + drawn + '. Before it the player was clearly winning';
      } else if (hadMate) {
        key = 'the player had a forced checkmate in ' + d.before.mate + ' starting with ' + facts.best + ' and missed it';
      } else if (allowsMate) {
        key = 'the move allows a forced checkmate in ' + d.after.mate + (replySan ? ', starting with ' + replySan : '');
      } else if (slipped && !hung.length) {
        key = 'before the move the player was clearly winning. After it the engine rates the game as level, most likely a draw by repeated checks, starting with the opponent\'s check ' + replySan;
      } else if (hung.length) {
        key = hung.map(function (c) { return 'the opponent can reply ' + c.san + ', taking the player\'s ' + NAME[c.captured] + ' on ' + c.to + (c.back ? ' with a less valuable piece' : ' for free'); }).join('; ');
      } else if (threat && threat.loose) {
        key = 'the opponent can reply ' + threat.san + ', and that piece then attacks ' +
          threat.list.filter(function (t) { return t.indexOf('not defended') !== -1; }).join(' and ');
      } else if (bestCap) {
        key = 'the player missed a capture';
      } else if (trade) {
        key = 'the move was a roughly even trade: the player\'s ' + NAME[d.move.piece] + ' took a ' + NAME[d.move.captured] + ' on ' + d.move.to +
          ' and the opponent takes back with ' + replyCap.san + '. Nothing was hung. The engine gives no further reason, so do not invent one';
      } else {
        key = 'the engine expects the opponent to reply ' + replySan + '; its expected line is ' + facts.replyLine + '. No piece is hung and no capture was missed. The engine gives no further reason, so do not invent one';
      }
      var bestText = label === 'good' ? '' : ' The engine preferred ' + facts.best +
        (bestCap ? ', which captures a ' + NAME[bestCap.captured] + (bestCap.back ? '' : ' that the opponent could not take back') : '') + '.';
      var u = [
        'Facts: The player has ' + (side === 'w' ? 'White' : 'Black') + '. Move ' + note.moveNo + ': ' + d.move.san +
          (d.move.captured ? ', capturing a ' + NAME[d.move.captured] : '') + '.',
        'Verdict: ' + (label === 'good' ? 'good move, it punished the opponent\'s mistake' : label) + '.',
        'After it the engine rates the position as ' + standing(rawAfter) + '.',
        'Key fact: ' + key + '.' + bestText
      ];
      var myGen = gen;
      explain('move', MOVE_SYSTEM, u.join('\n')).then(function (r) {
        if (r.text) { note.text = r.text; note.by = r.by; }
        else note.error = 'empty reply';
      }, function (err) {
        note.error = (err && (err.code || err.message)) || 'unknown error';
        providerFailed(err);
      }).then(function () {
        note.pending = false;
        if (myGen === gen || notes.indexOf(note) !== -1) { renderCoach(); renderSheet(); save(); }
      });
    }
    renderCoach();
    renderSheet();
    save();
  }

  /* ---------- coach: commentary providers (D006) ----------
     local-omlx   : the locally served page; a local model behind oMLX's OpenAI-compatible endpoint.
     cloud-claude : the published artifact only; Claude on the viewer's account.
     The provider is fixed by where the page runs. There is no fallback from one to the other. */
  // The answer must come on a line starting with a marker, so it can be picked out of any reasoning the
  // model writes first. A reply with no marker is discarded, never shown.
  var MOVE_SYSTEM = [
    'You are a chess coach for a beginner rated about 500-600. A chess engine has already judged the move. Turn the facts into one short comment for the player.',
    'Use only the facts given. Never add a move, threat or reason that is not listed, and never contradict the engine.',
    'Reply with exactly one line in this form and nothing after it:',
    'COMMENT: <at most two short sentences and at most 30 words, spoken to the player as "you": what went wrong or right, then one habit for next time>',
    'If the key fact gives no reason, say only what the engine preferred and what it expects in reply, then give a general habit. Do not explain why.',
    'No evaluation numbers. No markdown.',
    '',
    'Two examples of the form.',
    'Facts: Move 9: Qh5. Verdict: blunder. Key fact: the opponent can reply Nxh5, taking the player\'s queen on h5 for free. The engine preferred Qd2.',
    'COMMENT: Your queen on h5 could simply be taken by the knight. Before each move, check which of your pieces the opponent can capture.',
    'Facts: Move 14: Rxd5, capturing a rook. Verdict: good move, it punished the opponent\'s mistake. Key fact: the opponent\'s previous move was a mistake that left the rook on d5 where it could be taken.',
    'COMMENT: You spotted the loose rook on d5 and took it. Keep scanning for loose pieces after every opponent move.'
  ].join('\n');
  var REVIEW_SYSTEM = [
    'You are a chess coach for a beginner rated about 500-600, reviewing a game they just played against a computer opponent.',
    'A chess engine judged every move. Use only the facts given. Never contradict the engine and never invent moves, positions or variations.',
    'Reply with exactly one line in this form and nothing after it:',
    'REVIEW: <at most three short sentences and at most 60 words, spoken to the player as "you": the pattern that cost or won the most, then one specific thing to practise next game>',
    'If the player was clearly winning for many moves before the game ended, say that converting a won position faster is worth practising.',
    'No evaluation numbers. No markdown. No lists.'
  ].join('\n');
  var LIMITS = { move: { marker: 'COMMENT:', sentences: 2, words: 40 }, review: { marker: 'REVIEW:', sentences: 3, words: 75 } };

  var CFG = (window.CHESS_COACH_CONFIG && window.CHESS_COACH_CONFIG.local) || {};
  var LOCAL = {
    endpoint: String(CFG.endpoint || 'http://127.0.0.1:8000').replace(/\/+$/, ''),
    token: CFG.token || '',
    moveModel: CFG.moveModel || '',
    reviewModel: CFG.reviewModel || CFG.moveModel || '',
    temperature: typeof CFG.temperature === 'number' ? CFG.temperature : 0.2,
    maxTokensMove: CFG.maxTokensMove || 1500,
    maxTokensReview: CFG.maxTokensReview || 3000,
    timeoutMs: CFG.timeoutMs || 180000
  };

  function canExplain() { return coach.resolved && coach.on; }

  // Local models reason before they answer, inside <think> tags or as plain preamble. Keep only what
  // follows the last marker, and hold it to the length limit in code as well as in the prompt.
  function extractAnswer(text, kind) {
    var lim = LIMITS[kind];
    var t = String(text || '');
    var close = t.lastIndexOf('</think>');
    if (close !== -1) t = t.slice(close + 8);
    var at = t.lastIndexOf(lim.marker);
    if (at === -1) return '';
    t = t.slice(at + lim.marker.length).split(/\n\s*\n/)[0].replace(/\s+/g, ' ').trim();
    t = t.replace(/^[<"'`*\s]+|[>"'`*\s]+$/g, '');
    var parts = t.match(/[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/g) || [t];
    var out = [];
    for (var i = 0; i < parts.length && out.length < lim.sentences; i++) {
      var next = out.concat(parts[i].trim()).join(' ');
      if (out.length && next.split(' ').length > lim.words) break;
      out.push(parts[i].trim());
    }
    return out.join(' ');
  }

  function localFetch(path, body, timeoutMs) {
    var ctl = new AbortController();
    var timer = setTimeout(function () { ctl.abort(); }, timeoutMs);
    var opt = { method: body ? 'POST' : 'GET', headers: { 'Authorization': 'Bearer ' + LOCAL.token }, signal: ctl.signal };
    if (body) { opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(body); }
    return fetch(LOCAL.endpoint + path, opt).then(function (res) {
      clearTimeout(timer);
      if (!res.ok) throw { code: 'http ' + res.status };
      return res.json();
    }, function (err) {
      clearTimeout(timer);
      throw { code: err && err.name === 'AbortError' ? 'timed out' : 'unreachable' };
    });
  }

  // One call for both providers. Resolves {text, by}; rejects {code}.
  function explain(kind, system, user, onText) {
    if (coach.kind === 'local-omlx') {
      var model = kind === 'review' ? LOCAL.reviewModel : LOCAL.moveModel;
      // One retry when the reply holds no answer line: the model sometimes reasons past its token limit.
      var attempt = function (left) {
        return localFetch('/v1/chat/completions', {
          model: model, temperature: LOCAL.temperature,
          max_tokens: kind === 'review' ? LOCAL.maxTokensReview : LOCAL.maxTokensMove,
          messages: [{ role: 'system', content: system }, { role: 'user', content: user }]
        }, LOCAL.timeoutMs).then(function (j) {
          var msg = j && j.choices && j.choices[0] && j.choices[0].message;
          var text = extractAnswer(msg && msg.content, kind);
          if (text) return { text: text, by: model + ' (local)' };
          if (left > 0) return attempt(left - 1);
          throw { code: 'no answer in the reply' };
        });
      };
      return attempt(1);
    }
    return Promise.resolve().then(function () {
      var opt = { modelTier: 'default' };
      if (onText) opt.onText = function (u) { var part = extractAnswer(u.text, kind); if (part) onText(part); };
      return coach.sample(system + '\n\n' + user, opt);
    }).then(function (res) {
      var text = extractAnswer(res && res.text, kind);
      if (!text) throw { code: 'no answer in the reply' };
      return { text: text, by: 'Claude (cloud)' };
    });
  }

  function providerFailed(err) {
    var code = err && err.code;
    if (coach.kind === 'local-omlx' && code === 'unreachable') { coach.on = false; coach.problem = 'unreachable'; }
    if (coach.kind === 'cloud-claude' && code === 'not_granted') { coach.on = false; coach.problem = 'denied'; }
  }

  function probeLocal() {
    coach.resolved = false;
    coach.problem = '';
    renderCoach();
    return localFetch('/v1/models', null, 4000).then(function () {
      coach.on = true;
    }, function () {
      coach.on = false;
      coach.problem = 'unreachable';
    }).then(function () { coach.resolved = true; renderCoach(); });
  }

  function initCoach() {
    var c = window.claude;
    if (!c || !c.use) { coach.kind = 'local-omlx'; probeLocal(); return; }
    coach.kind = 'cloud-claude';
    Promise.all([c.use('sample'), c.use('permissions')]).then(function (r) {
      coach.sample = r[0]; coach.perms = r[1];
      if (!coach.sample) { coach.problem = 'unavailable'; return null; }
      var wanted = false;
      try { wanted = localStorage.getItem(STORE_KEY + '-coach') === 'on'; } catch (e) { /* optional */ }
      if (!coach.perms) { coach.on = wanted; return null; }
      return coach.perms.state('sample').then(function (st) {
        if (st === 'denied') coach.problem = 'denied';
        else if (st === 'unavailable') { coach.problem = 'unavailable'; coach.sample = null; }
        else if (st === 'granted' && wanted) coach.on = true;
      });
    }).then(null, function () { coach.sample = null; coach.problem = 'unavailable'; }).then(function () {
      coach.resolved = true;
      renderCoach();
    });
  }

  // The one button in the coach panel: "Retry" for the local model, "Turn on coaching" for cloud Claude.
  function gateAction() {
    var btn = $('coach-on');
    if (coach.kind === 'local-omlx') { probeLocal(); return; }
    btn.disabled = true;
    var ask = coach.perms ? coach.perms.request(['sample']) : Promise.resolve({ sample: 'granted' });
    ask.then(function (res) {
      var st = res && res.sample;
      if (st === 'denied') coach.problem = 'denied';
      else if (st === 'unavailable') { coach.problem = 'unavailable'; coach.sample = null; }
      else coach.on = true;
      try { localStorage.setItem(STORE_KEY + '-coach', coach.on ? 'on' : 'off'); } catch (e) { /* optional */ }
    }, function () {}).then(function () { btn.disabled = false; renderCoach(); });
  }

  /* ---------- coach: panel ---------- */
  function renderCoach() {
    var gate = $('coach-gate'), gateText = $('coach-gate-text'), gateBtn = $('coach-on');
    var log = $('coach-log'), stateEl = $('coach-state');
    var local = coach.kind === 'local-omlx';
    var showGate = false;

    if (!coach.resolved) {
      stateEl.textContent = local ? 'Looking for the local model…' : 'Checking…';
    } else if (coach.on) {
      stateEl.textContent = local ? 'Local model · ' + LOCAL.moveModel : 'Cloud · Claude';
    } else if (local) {
      stateEl.textContent = 'Local model not reachable · engine verdicts only';
      gateText.textContent = 'The local model at ' + LOCAL.endpoint + ' did not answer, so comments show the engine\'s verdict only. Start oMLX, then retry.';
      gateBtn.textContent = 'Retry';
      showGate = true;
    } else if (!coach.problem) {
      stateEl.textContent = 'Off · engine verdicts only';
      gateText.textContent = 'The engine checks every move you make. When one is worth talking about, Claude explains it in plain words. Each explanation uses your Claude account.';
      gateBtn.textContent = 'Turn on coaching';
      showGate = true;
    } else {
      stateEl.textContent = 'Engine verdicts only';
    }
    gate.hidden = !showGate;

    log.textContent = '';
    if (!notes.length) {
      var msg = 'No comments yet. The coach stays quiet unless a move is worth talking about.';
      if (coach.resolved && !coach.on && !local && coach.problem) {
        msg = (coach.problem === 'denied' ? 'Claude\'s commentary is switched off for this page.' : 'Claude\'s commentary is not available in this view.') +
          ' You still get the engine\'s verdict when a move is worth flagging.';
      }
      log.appendChild(el('p', 'coach-empty', msg));
    }
    for (var i = notes.length - 1; i >= 0; i--) {
      var n = notes[i];
      var card = el('div', 'note ' + n.label);
      var head = el('div', 'note-head');
      head.appendChild(el('span', 'note-move', n.moveNo + (n.ply % 2 === 0 ? '. ' : '… ') + n.san));
      head.appendChild(el('span', 'note-label', LABEL[n.label] + (n.theme && n.theme !== 'other' ? ' · ' + n.theme : '')));
      card.appendChild(head);
      card.appendChild(el('p', 'note-text' + (n.pending ? ' pending' : ''), n.pending ? 'The coach is writing…' : n.text));
      var f = n.facts;
      card.appendChild(el('p', 'note-facts', n.label === 'good'
        ? 'Evaluation ' + fmtEval(f.evalBefore) + ' → ' + fmtEval(f.evalAfter)
        : 'Engine preferred ' + f.best + ' · evaluation ' + fmtEval(f.evalBefore) + ' → ' + fmtEval(f.evalAfter)));
      if (!n.pending) {
        var by = n.by || (n.byClaude ? 'Claude (cloud)' : '');
        card.appendChild(el('p', 'note-by', by ? 'Written by ' + by
          : 'Engine verdict only' + (n.error ? ' · the model did not answer (' + n.error + ')' : '')));
      }
      log.appendChild(card);
    }

    var rv = $('review'), btn = $('review-btn'), txt = $('review-text'), rby = $('review-by');
    rv.hidden = !isOver();
    if (isOver()) {
      txt.textContent = review.text || localReview();
      rby.textContent = review.busy ? '' : review.by ? 'Written by ' + review.by
        : 'Engine counts only' + (review.error ? ' · the model did not answer (' + review.error + ')' : '');
      btn.hidden = !canExplain() || review.busy || !!review.by;
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
    if (!canExplain() || review.busy) return;
    var s = gameStats();
    var yours = game.turn() === state.side;
    var outcome = state.resigned ? 'The player resigned.' : game.in_checkmate() ? (yours ? 'The player was checkmated.' : 'The player won by checkmate.') : 'The game was drawn (' + $('status-main').textContent + ').';
    var themeCounts = Object.keys(s.themes).map(function (k) { return k + ' x' + s.themes[k]; }).join(', ');
    var u = [
      'The player had the ' + (state.side === 'w' ? 'White' : 'Black') + ' pieces. ' + outcome + ' The game lasted ' + s.lastMove + ' moves.',
      'Flagged moves: ' + s.counts.blunder + ' blunders, ' + s.counts.mistake + ' mistakes, ' + s.counts.good + ' times the player punished an opponent mistake.',
      'Kinds of flagged moment, counted: ' + (themeCounts || 'none') + '.',
      s.winMove !== null
        ? 'The engine first rated the player clearly winning (ahead by 7 pawns or more) after move ' + s.winMove + '. The game ended on move ' + s.lastMove + '.'
        : 'The engine never rated the player clearly winning (ahead by 7 pawns or more).',
      'The flagged moments, in order:'
    ];
    if (!notes.length) u.push('(none)');
    notes.forEach(function (n) {
      u.push('- Move ' + n.moveNo + ', ' + n.san + ': ' + LABEL[n.label] + (n.theme ? ' (' + n.theme + ')' : '') + '. ' + n.text);
    });
    
    review = { text: 'The coach is writing…' + (coach.kind === 'local-omlx' ? ' The review model takes about half a minute.' : ''), busy: true, by: '', error: '' };
    renderCoach();
    var myGen = gen;
    explain('review', REVIEW_SYSTEM, u.join('\n'), function (t) {
      if (myGen === gen) { review.text = t; $('review-text').textContent = t; }
    }).then(function (r) {
      if (myGen !== gen) return;
      if (r.text) { review.text = r.text; review.by = r.by; } else { review.text = ''; review.error = 'empty reply'; }
    }, function (err) {
      if (myGen !== gen) return;
      review.text = '';
      review.error = (err && (err.code || err.message)) || 'unknown error';
      providerFailed(err);
    }).then(function () {
      if (myGen === gen) { review.busy = false; renderCoach(); save(); }
    });
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
    review = { text: '', busy: false, by: '', error: '' };
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
      review = { text: '', busy: false, by: '', error: '' };
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
      track: track, review: review.by ? review.text : '', reviewBy: review.by || ''
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
    if (typeof data.review === 'string' && data.review) review = { text: data.review, busy: false, by: typeof data.reviewBy === 'string' && data.reviewBy ? data.reviewBy : 'Claude (cloud)', error: '' };
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
  $('coach-on').addEventListener('click', gateAction);
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
