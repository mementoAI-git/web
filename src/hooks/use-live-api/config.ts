
// ── Gemini model version (single source of truth for the web) ───────
// Override via VITE_GEMINI_LIVE_MODEL in your .env if needed.
export const GEMINI_CONFIG = {
  MODEL:
    import.meta.env.VITE_GEMINI_LIVE_MODEL ||
    "gemini-2.5-flash-native-audio-preview-09-2025",
  VOICE_CONFIG: {
    voiceName: "Fenrir",
  },
};
