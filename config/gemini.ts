// Gemini AI Configuration - Updated for Live API integration
export const GEMINI_CONFIG = {
  // Your Gemini API key
  API_KEY: "AIzaSyALT4GS2QLBDejY-zBngUwtO690wucnLyA",  //"AIzaSyA1CkTAac-3xD04CdZ-iw0BjFFc95HKBkw",

  // Model configuration - using native audio model for best voice experience
  MODEL: "models/gemini-2.0-flash-exp",

  // Voice configuration - matches official documentation
  VOICE_CONFIG: {
    voiceName: "Aoede", // High-quality, natural voice
    // Other available voices: "Charon", "Fenrir", "Kore", "Nyx", "Puck"
  },

  // System instructions
  SYSTEM_INSTRUCTIONS: {
    default: "You are a helpful AI assistant. Respond naturally and conversationally to voice input.",
    memory: "You are a memory assistant helping users capture and organize their thoughts, experiences, and important moments. Respond naturally and help them reflect on their memories.",
    chat: "You are a conversational AI assistant. Engage in natural, helpful conversations with users.",
  },

  // Response modalities for Live API - matches official documentation
  RESPONSE_MODALITIES: "audio" as const,

  // Audio settings - matches official requirements
  AUDIO_SETTINGS: {
    sampleRate: 16000, // Required: 16kHz input
    outputSampleRate: 24000, // Output is 24kHz
    channels: 1, // Mono
    bitDepth: 16, // 16-bit PCM
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },

  // Live API configuration
  LIVE_API_CONFIG: {
    // Voice Activity Detection settings
    voiceActivityDetection: {
      enableVoiceActivityDetection: true,
    },

    // Tool use configuration
    toolUse: {
      enableToolUse: false, // Set to true if you want to use tools
    },

    // Session management
    sessionManagement: {
      enableSessionManagement: true,
    }
  }
};

// Helper function to get system instruction based on context
export function getSystemInstruction(context: keyof typeof GEMINI_CONFIG.SYSTEM_INSTRUCTIONS = "default") {
  return GEMINI_CONFIG.SYSTEM_INSTRUCTIONS[context];
}

// Helper function to validate API key
export function validateApiKey(): boolean {
  return !!GEMINI_CONFIG.API_KEY && GEMINI_CONFIG.API_KEY.length > 0;
}

// Helper function to get Live API config
export function getLiveApiConfig() {
  return {
    model: GEMINI_CONFIG.MODEL,
    responseModalities: GEMINI_CONFIG.RESPONSE_MODALITIES,
    speechConfig: {
      voiceConfig: {
        prebuiltVoiceConfig: GEMINI_CONFIG.VOICE_CONFIG
      }
    },
    systemInstruction: {
      parts: [{ text: GEMINI_CONFIG.SYSTEM_INSTRUCTIONS.default }]
    },
    ...GEMINI_CONFIG.LIVE_API_CONFIG
  };
}
