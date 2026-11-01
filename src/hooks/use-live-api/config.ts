
// ── Gemini model version (single source of truth for the web) ───────
// Override via VITE_GEMINI_LIVE_MODEL in your .env if needed.
export const GEMINI_CONFIG = {
  MODEL:
    import.meta.env.VITE_GEMINI_LIVE_MODEL ||
    "gemini-3.8-live",
  VOICE_CONFIG: {
    voiceName: "Fenrir",
  },
};
