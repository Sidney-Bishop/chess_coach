#!/usr/bin/env python3
"""Trial of short-comment prompts against the local models (oMLX).

Runs a few prompt variants over five fixed coaching moments and prints, for each,
how long it took, how many tokens the model spent, whether the answer could be
separated from the model's reasoning, and the comment itself.

Usage:  python3 scripts/prompt_trial.py
Standard library only. Nothing is written to disk.
"""
import json
import re
import time
import urllib.error
import urllib.request

ENDPOINT = "http://127.0.0.1:8000/v1/chat/completions"
TOKEN = "claude"
ORNITH = "Ornith-1.5-35B-A3B-OptiQ-4bit"
QWEN = "Qwen3.8-27B-4bit"

BASE = (
    "You are a chess coach for a beginner rated about 500-600. A chess engine has already "
    "judged the move. Turn the facts into one short comment for the player.\n"
    "Use only the facts given. Never add a move, threat or reason that is not listed, and never "
    "contradict the engine.\n"
    "Reply with exactly one line in this form and nothing after it:\n"
    "COMMENT: <at most two short sentences and at most 30 words, spoken to the player as \"you\": "
    "what went wrong or right, then one habit for next time>\n"
    "No evaluation numbers. No markdown."
)
EXAMPLES = (
    "\n\nTwo examples of the form.\n"
    "Facts: Move 9: Qh5. Verdict: blunder. Key fact: the opponent can reply Nxh5, taking the "
    "player's queen on h5 for free. The engine preferred Qd2.\n"
    "COMMENT: Your queen on h5 could simply be taken by the knight. Before each move, check "
    "which of your pieces the opponent can capture.\n"
    "Facts: Move 14: Rxd5, capturing a rook. Verdict: good move, it punished the opponent's "
    "mistake. Key fact: the opponent's previous move left the rook on d5 undefended.\n"
    "COMMENT: You spotted the undefended rook on d5 and took it. Keep scanning for loose pieces "
    "after every opponent move."
)
NO_THINK = "\nDo not reason out loud. Do not explain your thinking. Write the COMMENT line immediately."

VARIANTS = [
    # name, model, system prompt, extra request fields, text appended to the user message
    ("A marker only", ORNITH, BASE, {}, ""),
    ("B marker + examples", ORNITH, BASE + EXAMPLES, {}, ""),
    ("C B + thinking off", ORNITH, BASE + EXAMPLES + NO_THINK,
     {"chat_template_kwargs": {"enable_thinking": False}}, " /no_think"),
    ("D B on Qwen", QWEN, BASE + EXAMPLES, {}, ""),
]

CASES = [
    ("Ne5 missed threat",
     "The player has White. Move 6: Ne5. Verdict: blunder. After it the engine rates the position "
     "as clearly losing for the player. Key fact: the opponent can reply Qg5, and the queen then "
     "attacks the player's knight on e5 (not defended) and pawn on g2 (not defended). The engine "
     "preferred Nxe4, which captures a pawn the opponent could not take back."),
    ("Bb5 no clear reason",
     "The player has White. Move 4: Bb5. Verdict: mistake. Before it the player was somewhat better; "
     "after it the position is roughly level. The engine preferred d4. Key fact: the engine expects "
     "the opponent to reply c6, a pawn move that attacks the player's bishop on b5; its expected "
     "line is c6 Ba4 b5 Bb3 b4. No piece is hung and no capture was missed."),
    ("dxc4 good capture",
     "The player has White. Move 7: dxc4, capturing the opponent's queen with a pawn. Verdict: good "
     "move, it punished the opponent's mistake. After it the engine rates the position as clearly "
     "winning for the player. Key fact: the opponent's previous move put the queen on c4 where the "
     "pawn on d3 could take it."),
    ("Kg2 missed capture",
     "The player has White. Move 25: Kg2. Verdict: blunder. After it the engine rates the position "
     "as clearly losing for the player. Key fact: the engine preferred Nxb1, where the knight on c3 "
     "captures the opponent's queen on b1 and the opponent could not take back. After Kg2 the "
     "opponent can reply Qf5, moving the queen to safety."),
    ("Qg6 stalemate",
     "The player has White. Move 41: Qg6. Verdict: blunder. Before it the player was clearly "
     "winning. Key fact: the move ended the game at once in a draw by stalemate: the opponent has "
     "no legal move and is not in check. The engine preferred Qh4, which was checkmate."),
]


def extract(content):
    """Separate the answer from any reasoning. Returns (comment, how)."""
    text = content or ""
    close = text.rfind("</think>")
    if close != -1:
        text = text[close + len("</think>"):]
    marks = [m.end() for m in re.finditer(r"COMMENT:", text)]
    if not marks:
        return "", "NO MARKER"
    answer = text[marks[-1]:].strip().split("\n\n")[0].strip().strip('"')
    return answer, "ok"


def ask(model, system, user, extra):
    body = {"model": model, "temperature": 0.2, "max_tokens": 1500,
            "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}]}
    body.update(extra)
    req = urllib.request.Request(ENDPOINT, data=json.dumps(body).encode(), headers={
        "Authorization": "Bearer " + TOKEN, "Content-Type": "application/json"})
    start = time.time()
    with urllib.request.urlopen(req, timeout=300) as res:
        data = json.load(res)
    choice = data["choices"][0]
    msg = choice["message"]
    return {
        "seconds": time.time() - start,
        "content": msg.get("content") or "",
        "reasoning_field": bool(msg.get("reasoning_content")),
        "tokens": data.get("usage", {}).get("completion_tokens", 0),
        "finish": choice.get("finish_reason", ""),
    }


def main():
    for name, model, system, extra, suffix in VARIANTS:
        print("\n=== VARIANT %s  [%s] ===" % (name, model))
        for case, facts in CASES:
            try:
                r = ask(model, system, "Facts: " + facts + suffix, extra)
            except urllib.error.HTTPError as e:
                print("  %-20s HTTP %s: %s" % (case, e.code, e.read()[:200].decode("utf-8", "replace")))
                continue
            except Exception as e:  # noqa: BLE001 - a trial script: report and carry on
                print("  %-20s FAILED: %s" % (case, e))
                continue
            comment, how = extract(r["content"])
            words = len(comment.split())
            leaked = len(r["content"].split()) - words
            print("  %-20s %5.1fs  %4d tok  finish=%-6s reasoning_field=%-5s extract=%-9s words=%-3d words_outside_answer=%d"
                  % (case, r["seconds"], r["tokens"], r["finish"], r["reasoning_field"], how, words, leaked))
            if comment:
                print("      -> " + comment)
            else:
                print("      RAW START: " + " ".join(r["content"].split())[:220])


if __name__ == "__main__":
    main()
