import type { Meta, StoryObj } from "@storybook/react-vite";
import { useLayoutEffect, type ReactNode } from "react";
import { SWRConfig, unstable_serialize } from "swr";
import { ModalProvider } from "@/hooks/use-modal";
import { StoryMobileMedia } from "@/components/modal/memory/story-mobile-media";
import { parseFileTranscription } from "@/features/audio/transcript-player";
import type { IFile } from "@/utility/interface";
import TranscriptAudioPlayer from "./transcript-audio-player";
import { RecordingCard } from "@/pages/dashboard/stories/components/recording-card";

type ThemeName = "light-sky" | "daylight" | "dark" | "deep-sky";

/** Puts the app's theme classes on <html>, as src/lib/theme.ts does. */
function Themed({ theme, children }: { theme: ThemeName; children: ReactNode }) {
  useLayoutEffect(() => {
    const root = document.documentElement.classList;
    root.toggle("light-sky", theme === "light-sky");
    root.toggle("daylight", theme === "daylight");
    root.toggle("dark", theme === "dark" || theme === "deep-sky");
    root.toggle("deep-sky", theme === "deep-sky");
  }, [theme]);
  return <div className="flex min-h-[760px] items-center justify-center bg-background p-6">{children}</div>;
}

/** 12 seconds of tones where people "speak", so the player has real audio to play. */
function sampleAudio() {
  const rate = 8000;
  const seconds = 12;
  const samples = new Int16Array(rate * seconds);
  const spoken = [[0.4, 3.6], [4.4, 8.8], [9.4, 11.6]];
  for (let i = 0; i < samples.length; i += 1) {
    const t = i / rate;
    if (spoken.some(([start, end]) => t >= start && t < end)) samples[i] = Math.sin(t * 2 * Math.PI * 220) * 6000;
  }
  const header = new DataView(new ArrayBuffer(44));
  const text = (offset: number, value: string) => [...value].forEach((c, i) => header.setUint8(offset + i, c.charCodeAt(0)));
  text(0, "RIFF");
  header.setUint32(4, 36 + samples.byteLength, true);
  text(8, "WAVEfmt ");
  header.setUint32(16, 16, true);
  header.setUint16(20, 1, true);
  header.setUint16(22, 1, true);
  header.setUint32(24, rate, true);
  header.setUint32(28, rate * 2, true);
  header.setUint16(32, 2, true);
  header.setUint16(34, 16, true);
  text(36, "data");
  header.setUint32(40, samples.byteLength, true);
  return URL.createObjectURL(new Blob([header, samples], { type: "audio/wav" }));
}

const CONVERSATION = parseFileTranscription({
  full_text: "",
  segments: [
    { start: 0, end: 4.2, text: "Hi, it’s good to hear from you. How did the visit to your grandmother go?", speaker: "ai" },
    { start: 4.2, end: 9.2, text: "It was lovely. She showed me the photo album from when she moved to Lagos, and told me about the market where she sold fabric.", speaker: "user" },
    { start: 9.2, end: 12, text: "That sounds special. Would you like to save that as a story?", speaker: "ai" },
  ],
  speech: [{ start: 0.4, end: 3.6 }, { start: 4.4, end: 8.8 }, { start: 9.4, end: 11.6 }],
})!;

function WithTranscript({ children }: { children: ReactNode }) {
  return (
    <SWRConfig value={{ fallback: { [unstable_serialize(["file-transcription", "demo-call"])]: CONVERSATION }, provider: () => new Map() }}>
      {children}
    </SWRConfig>
  );
}

const meta = {
  title: "Media/TranscriptAudioPlayer",
  argTypes: { theme: { control: "select", options: ["light-sky", "daylight", "dark", "deep-sky"] } },
} satisfies Meta<{ theme: ThemeName }>;

export default meta;
type Story = StoryObj<{ theme: ThemeName }>;

export const RecordedConversation: Story = {
  args: { theme: "light-sky" },
  render: ({ theme }) => (
    <Themed theme={theme}>
      <WithTranscript>
        <TranscriptAudioPlayer src={sampleAudio()} fileId="demo-call" name="voice_call_1762870000000.m4a" duration={12} />
      </WithTranscript>
    </Themed>
  ),
};

export const Music: Story = {
  args: { theme: "light-sky" },
  render: ({ theme }) => (
    <Themed theme={theme}>
      <TranscriptAudioPlayer src={sampleAudio()} fileId="demo-song" name="Summer evening.mp3" duration={12} />
    </Themed>
  ),
};

const RECORDING: IFile = {
  _id: "demo-call",
  name: "voice_call_1762870000000.m4a",
  type: "audio/m4a",
  url: "",
  duration: 754,
} as IFile;

/** The story page's audio row, which opens this player. */
export const StoryPageRow: Story = {
  args: { theme: "light-sky" },
  render: ({ theme }) => (
    <Themed theme={theme}>
      <ModalProvider>
        <div className="w-[420px]">
          <StoryMobileMedia section="media" files={[RECORDING]} title="Conversation with Memento · Nov 11, 2026" />
        </div>
      </ModalProvider>
    </Themed>
  ),
};

/** The stories grid's card for a recorded conversation, which opens this player. */
export const StoriesGridCard: Story = {
  args: { theme: "light-sky" },
  render: ({ theme }) => (
    <Themed theme={theme}>
      <div className="grid w-[460px] grid-cols-2 gap-5">
        <RecordingCard duration={754} className="aspect-[4/5] rounded-[20px] border-0" />
        <RecordingCard duration={62} className="aspect-square rounded-[20px] border-0" />
      </div>
    </Themed>
  ),
};
