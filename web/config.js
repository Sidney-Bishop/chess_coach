/* Chess Coach configuration (D006, D009).
   Defaults for the local model, used when the page is served from web/. The player can change the
   coach model in the page under "Coach model"; those choices, and any API key, are kept in the
   browser, never in this file. Temperature, token limits and timeout here apply to every provider.
   The published artifact also loads this file but leaves these settings unused: it uses cloud Claude.
   The token is the loopback literal for a server bound to 127.0.0.1, not a secret. */
window.CHESS_COACH_CONFIG = {
  local: {
    endpoint: 'http://127.0.0.1:8000',            // oMLX, OpenAI-compatible /v1/chat/completions
    token: 'claude',
    moveModel: 'Ornith-1.5-35B-A3B-OptiQ-4bit',   // per-move comments: fast
    reviewModel: 'Qwen3.8-27B-4bit',              // end-of-game review: slower, more thorough
    temperature: 0.2,
    maxTokensMove: 1500,                          // generous: reasoning counts against the limit
    maxTokensReview: 3000,
    timeoutMs: 180000
  }
};
