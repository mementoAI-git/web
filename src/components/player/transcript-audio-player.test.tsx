import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test";
import TranscriptAudioPlayer from "./transcript-audio-player";

const post = vi.hoisted(() => vi.fn());
vi.mock("@/api/mutations", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/api/mutations")>()),
  post,
}));

const CONVERSATION = {
  full_text: "Memento: Hello\nYou: Hi there",
  segments: [
    { start: 0, end: 4, text: "Hello, how was today?", speaker: "ai" },
    { start: 4, end: 10, text: "Hi there, it was good.", speaker: "user" },
  ],
  speech: [{ start: 0.5, end: 3 }, { start: 4.2, end: 9 }],
};

function renderPlayer(props: Partial<Parameters<typeof TranscriptAudioPlayer>[0]> = {}) {
  renderWithProviders(
    <TranscriptAudioPlayer src="blob:call" fileId="f1" name="voice_call_1.m4a" duration={10} {...props} />,
  );
  const audio = screen.getByTestId("transcript-audio-player").querySelector("audio")!;
  audio.play = vi.fn().mockResolvedValue(undefined);
  return audio;
}

describe("TranscriptAudioPlayer", () => {
  beforeEach(() => {
    post.mockReset();
    post.mockResolvedValue({ success: true, data: CONVERSATION });
  });

  it("shows a recorded conversation's transcript with who spoke, and speech on the timeline", async () => {
    renderPlayer();
    expect(await screen.findByText("Memento")).toBeInTheDocument();
    expect(screen.getByText("You")).toBeInTheDocument();
    expect(post).toHaveBeenCalledWith("/ai/transcribe-audio", { file_id: "f1" }, expect.anything());
    expect(screen.getAllByTestId("speech-block")).toHaveLength(2);
    // Speech in the theme's strong ink, not purple; what hasn't played yet is dimmed.
    expect(screen.getAllByTestId("speech-block")[0]).toHaveClass("bg-text-neutral-strong");
    expect(screen.getAllByTestId("speech-block")[0].parentElement).toHaveClass("opacity-35");
    expect(screen.getByText("-00:10")).toBeInTheDocument();
  });

  it("reads the member's words in the brand colour and Memento's in the strong text colour", async () => {
    renderPlayer();
    const you = await screen.findByRole("button", { name: /^You, / });
    const memento = screen.getByRole("button", { name: /^Memento, / });
    expect(you.querySelector(".font-geist")).toHaveClass("text-text-brand-strong", "transcript-you");
    expect(memento.querySelector(".font-geist")).toHaveClass("text-text-neutral-strong");
  });

  it("highlights the word being spoken and dims what's still to come", async () => {
    const audio = renderPlayer();
    // Into the member's turn ("Hi there, it was good."), speech from 4.2s to 9s.
    fireEvent.click(await screen.findByRole("button", { name: /^You, 00:04\./ }));
    audio.currentTime = 6;
    fireEvent.click(screen.getByRole("button", { name: "Forward 5 seconds" }));
    fireEvent.click(screen.getByRole("button", { name: "Back 5 seconds" }));
    const word = await screen.findByTestId("spoken-word");
    expect(word).toHaveClass("bg-fill-brand-strong", "text-text-inverse-strong");
    expect(word.textContent).not.toMatch(/\s/);
    expect(word.nextElementSibling).toHaveClass("opacity-45");
  });

  it("lays the heading beside the player, above the transcript", async () => {
    renderWithProviders(
      <TranscriptAudioPlayer src="blob:call" fileId="f1" name="voice_call_1.m4a" duration={10} heading={<h1>Bike day</h1>} />,
    );
    const player = screen.getByTestId("transcript-audio-player");
    expect(screen.getByRole("heading", { name: "Bike day" }).parentElement).toHaveClass("[grid-area:heading]");
    expect(screen.getByRole("region", { name: "Player" })).toHaveClass("[grid-area:player]");
    expect((await screen.findByTestId("audio-transcript")).parentElement).toHaveClass("[grid-area:transcript]");
    expect(player.className).toContain("lg:[grid-template-areas:'player_heading'_'player_transcript']");
  });

  it("plays from a turn when it is clicked", async () => {
    const audio = renderPlayer();
    // The turn starts where its speech does (4.2s), not where the transcript first showed it.
    fireEvent.click(await screen.findByRole("button", { name: /^You, 00:04\./ }));
    expect(audio.currentTime).toBeCloseTo(4.2);
    expect(screen.getByText("-00:06")).toBeInTheDocument();
  });

  it("skips 5 seconds without passing the ends, and scrubs from the keyboard", () => {
    const audio = renderPlayer();
    fireEvent.click(screen.getByRole("button", { name: "Forward 5 seconds" }));
    expect(audio.currentTime).toBe(5);
    fireEvent.click(screen.getByRole("button", { name: "Back 5 seconds" }));
    fireEvent.click(screen.getByRole("button", { name: "Back 5 seconds" }));
    expect(audio.currentTime).toBe(0);
    fireEvent.keyDown(screen.getByRole("slider", { name: "Playback position" }), { key: "End" });
    expect(audio.currentTime).toBe(10);
  });

  it("applies the chosen speed when playing", () => {
    const audio = renderPlayer();
    fireEvent.click(screen.getByRole("button", { name: "Playback speed 1x" }));
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    expect(audio.playbackRate).toBe(1.25);
    expect(audio.play).toHaveBeenCalledOnce();
  });

  it("keeps music untranscribed until the transcript is turned on", async () => {
    renderPlayer({ name: "song.mp3" });
    expect(screen.getByText("song")).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("switch", { name: "Transcript" }));
    await waitFor(() => expect(post).toHaveBeenCalledOnce());
  });

  it("fills the played part of the track when there's no speech to show", () => {
    const audio = renderPlayer({ fileId: undefined, name: "song.mp3" });
    fireEvent.click(screen.getByRole("button", { name: "Forward 5 seconds" }));
    expect(audio.currentTime).toBe(5);
    expect(screen.getByTestId("timeline-progress")).toHaveClass("bg-fill-tab-active");
    expect(screen.getByTestId("timeline-progress")).toHaveStyle({ width: "50%" });
  });

  it("offers no transcript for audio that isn't saved yet", () => {
    renderPlayer({ fileId: undefined });
    expect(screen.queryByRole("switch", { name: "Transcript" })).not.toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });
});
