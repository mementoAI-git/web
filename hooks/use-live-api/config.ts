
export const GEMINI_CONFIG = {
  API_KEY: "AIzaSyALT4GS2QLBDejY-zBngUwtO690wucnLyA",  //"AIzaSyA1CkTAac-3xD04CdZ-iw0BjFFc95HKBkw",
  MODEL: "gemini-2.5-flash-native-audio-preview-09-2025",
  VOICE_CONFIG: {
    voiceName: "Aoede",
  },
  SYSTEM_INSTRUCTIONS: {
    default: "You are a helpful assistant. Keep responses concise and conversational.",
    memory: "You are a memory assistant helping users capture and organize their thoughts, experiences, and important moments. Respond naturally and help them reflect on their memories.",
    chat: "You are a conversational AI assistant. Engage in natural, helpful conversations with users.",
  },
};

// Helper function to get system instruction based on context
export function getSystemInstruction(context: keyof typeof GEMINI_CONFIG.SYSTEM_INSTRUCTIONS = "default") {
  return GEMINI_CONFIG.SYSTEM_INSTRUCTIONS[context];
}
