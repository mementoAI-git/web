# Live API Implementation

This project now includes a modern implementation of Google's Gemini Live API for real-time voice interactions.

## Features

- **Real-time Voice Interaction**: Stream audio directly to Gemini and receive audio responses
- **Transcript Management**: Automatic capture of both user and AI conversation transcripts
- **Volume Visualization**: Real-time audio level monitoring with visual feedback
- **Modern WebSocket Connection**: Uses the official Google GenAI SDK
- **Audio Processing**: Automatic audio format conversion (16kHz PCM) for optimal API performance

## Key Components

### 1. Live API Context (`hooks/use-live-api/context.tsx`)
Provides React context for Live API functionality across the application.

### 2. Live API Hook (`hooks/use-live-api/index.ts`)
Core implementation using Google GenAI SDK with:
- WebSocket connection management
- Audio streaming and processing
- Transcript handling
- Volume monitoring

### 3. Voice Input Component (`components/Chatinput/Voiceinput.tsx`)
UI component for voice interaction with:
- Recording controls (start/stop/mute)
- Visual feedback with volume visualization
- Timer display
- Connection status management

## Usage

```tsx
import { LiveAPIProvider } from '@/hooks/use-live-api/context';
import { useLiveAPIContext } from '@/hooks/use-live-api/context';

// Wrap your app with the provider
function App() {
  return (
    <LiveAPIProvider>
      <YourComponents />
    </LiveAPIProvider>
  );
}

// Use in components
function VoiceComponent() {
  const { 
    connected, 
    connect, 
    disconnect, 
    volume, 
    transcript 
  } = useLiveAPIContext();

  // Your voice interaction logic here
}
```

## Configuration

The Live API supports various configuration options:

```tsx
setConfig({
  model: "gemini-2.0-flash-live-001", // or "gemini-live-2.5-flash-preview"
  systemInstruction: "Your custom system instruction",
  responseModalities: [Modality.AUDIO],
  speechConfig: {
    voiceConfig: {
      prebuiltVoiceConfig: {
        voiceName: "Aoede" // or other available voices
      }
    }
  },
  tools: [
    { googleSearch: {} }
  ]
});
```

## Audio Requirements

- **Input**: 16kHz, 16-bit PCM, mono
- **Output**: 24kHz audio response
- **Browser**: Requires HTTPS for microphone access

## Models Available

- `gemini-2.0-flash-live-001` (Half-cascade audio)
- `gemini-live-2.5-flash-preview` (Half-cascade audio)
- `gemini-2.5-flash-native-audio-preview-09-2025` (Native audio)
- `gemini-2.5-flash-preview-native-audio-dialog` (Native audio)

## Transcript Handling

The implementation automatically captures and manages conversation transcripts:

```tsx
type TranscriptEntry = {
  _id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: number;
};
```

## Error Handling

The implementation includes comprehensive error handling for:
- Connection failures
- Audio processing errors
- WebSocket disconnections
- Browser compatibility issues

## Browser Support

- Modern browsers with WebRTC support
- HTTPS required for microphone access
- Audio Worklet support recommended for volume monitoring
