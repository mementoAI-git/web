import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BackgroundMusicProvider, useBackgroundMusic } from "./use-background-music";

let savedMusic: string | undefined;
const audioInstances: MockAudio[] = [];

vi.mock("./use-store", () => ({
  useStore: () => ({ user: savedMusic ? { bg_music: savedMusic } : undefined }),
}));

class MockAudio extends EventTarget {
  src = "";
  loop = false;
  volume = 1;
  paused = true;
  load = vi.fn();
  play = vi.fn(async () => {
    this.paused = false;
    this.dispatchEvent(new Event("play"));
  });
  pause = vi.fn(() => {
    this.paused = true;
    this.dispatchEvent(new Event("pause"));
  });
  constructor() {
    super();
    audioInstances.push(this);
  }
}

function MusicControls() {
  const { currentTrack, isPlaying, playTrack, pauseTrack, resumeTrack } = useBackgroundMusic();
  return <>
    <output aria-label="Selected track">{currentTrack ?? "None"}</output>
    <output aria-label="Playback">{isPlaying ? "Playing" : "Stopped"}</output>
    <button onClick={() => playTrack("seawaves")}>Play track</button>
    <button onClick={pauseTrack}>Pause</button>
    <button onClick={resumeTrack}>Play saved track</button>
  </>;
}

const player = <BackgroundMusicProvider><MusicControls /></BackgroundMusicProvider>;

describe("BackgroundMusicProvider", () => {
  beforeEach(() => {
    savedMusic = "moonlight";
    audioInstances.length = 0;
    vi.stubGlobal("Audio", MockAudio);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("restores the saved track without starting playback", () => {
    render(player);
    expect(screen.getByLabelText("Selected track")).toHaveTextContent("moonlight");
    expect(screen.getByLabelText("Playback")).toHaveTextContent("Stopped");
    expect(audioInstances[0].src).toBe("/audio/moonlight.mp3");
    expect(audioInstances[0].play).not.toHaveBeenCalled();
  });

  it("does not autostart when the profile arrives after mounting", () => {
    savedMusic = undefined;
    const { rerender } = render(player);
    savedMusic = "moonlight";
    rerender(<BackgroundMusicProvider><MusicControls /></BackgroundMusicProvider>);
    expect(screen.getByLabelText("Selected track")).toHaveTextContent("moonlight");
    expect(audioInstances[0].play).not.toHaveBeenCalled();
  });

  it("waits for another user action after a refresh or new session", () => {
    const { unmount } = render(player);
    fireEvent.click(screen.getByRole("button", { name: "Play saved track" }));
    expect(screen.getByLabelText("Playback")).toHaveTextContent("Playing");
    unmount();
    render(player);
    expect(audioInstances[1].play).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Playback")).toHaveTextContent("Stopped");
  });

  it("plays and resumes music when the user requests it", () => {
    render(player);
    fireEvent.click(screen.getByRole("button", { name: "Play track" }));
    expect(audioInstances[0].src).toBe("/audio/seawaves.mp3");
    expect(screen.getByLabelText("Playback")).toHaveTextContent("Playing");
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(screen.getByLabelText("Playback")).toHaveTextContent("Stopped");
    fireEvent.click(screen.getByRole("button", { name: "Play saved track" }));
    expect(screen.getByLabelText("Playback")).toHaveTextContent("Playing");
  });
});
