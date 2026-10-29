import { toast } from "sonner";
import { act, waitFor } from "@testing-library/react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SWRConfig } from "swr";
import { BackgroundMusicProvider, useBackgroundMusic } from "./use-background-music";

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));
let accountId = "first-account";
let savedMusic: string | undefined;
const audioInstances: MockAudio[] = [];

vi.mock("./use-store", () => ({
  useStore: () => ({ user: savedMusic ? { _id: accountId, bg_music: savedMusic } : undefined }),
}));

class MockAudio extends EventTarget {
  src = "";
  loop = false;
  volume = 1;
  paused = true;
  load = vi.fn();
  play = vi.fn(async () => {
    this.paused = false;
    this.dispatchEvent(new Event("playing"));
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
  const { currentTrack, isPlaying, isBuffering, playTrack, pauseTrack, resumeTrack, stopTrack, audioFiles } = useBackgroundMusic();
  return <>
    <output aria-label="Track source">{audioFiles[0]?.file}</output>
    <output aria-label="Selected track">{currentTrack ?? "None"}</output>
    <output aria-label="Playback">{isPlaying ? "Playing" : "Stopped"}</output>
    <button onClick={() => playTrack("seawaves")}>Play track</button>
    <output aria-label="Buffering">{String(isBuffering)}</output>
    <button onClick={stopTrack}>Stop</button>
    <button onClick={pauseTrack}>Pause</button>
    <button onClick={resumeTrack}>Play saved track</button>
  </>;
}

const player = <BackgroundMusicProvider><MusicControls /></BackgroundMusicProvider>;

describe("BackgroundMusicProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it("ignores idle preload errors and media errors after Stop", () => {
    render(player);
    const audio = audioInstances[0];
    act(() => audio.dispatchEvent(new Event("error")));
    expect(toast.error).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("Play saved track"));
    fireEvent.click(screen.getByText("Stop"));
    act(() => audio.dispatchEvent(new Event("error")));
    expect(toast.error).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Playback")).toHaveTextContent("Stopped");
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


it("clears buffering and reports a playback failure once across error and rejection", async () => {
  vi.stubGlobal("Audio", MockAudio);
  render(player);
  const audio = audioInstances.at(-1)!;
  audio.play.mockImplementationOnce(() => Promise.reject(new Error("blocked")));
  fireEvent.click(screen.getByText("Play saved track"));
  await waitFor(() => expect(screen.getByLabelText("Buffering")).toHaveTextContent("false"));
  act(() => audio.dispatchEvent(new Event("error")));
  expect(toast.error).toHaveBeenCalledTimes(1);
  expect(screen.getByLabelText("Playback")).toHaveTextContent("Stopped");
  fireEvent.click(screen.getByText("Play saved track"));
  expect(screen.getByLabelText("Playback")).toHaveTextContent("Playing");
});
it("ignores an old play rejection after stop", async () => {
  vi.mocked(toast.error).mockClear();
  vi.stubGlobal("Audio", MockAudio);
  render(player);
  let reject!: (reason: Error) => void;
  audioInstances.at(-1)!.play.mockImplementationOnce(() => new Promise<void>((_, fail) => { reject = fail; }));
  fireEvent.click(screen.getByText("Play saved track"));
  expect(screen.getByLabelText("Buffering")).toHaveTextContent("true");
  fireEvent.click(screen.getByText("Stop"));
  await act(async () => reject(new Error("cancelled")));
  expect(toast.error).not.toHaveBeenCalled();
  expect(screen.getByLabelText("Buffering")).toHaveTextContent("false");
});


it("stops playback when the account changes, even with the same saved track", () => {
  vi.stubGlobal("Audio", MockAudio);
  savedMusic = "moonlight";
  accountId = "first-account";
  const { rerender } = render(player);
  fireEvent.click(screen.getByText("Play saved track"));
  expect(screen.getByLabelText("Playback")).toHaveTextContent("Playing");
  accountId = "second-account";
  rerender(<BackgroundMusicProvider><MusicControls /></BackgroundMusicProvider>);
  expect(screen.getByLabelText("Playback")).toHaveTextContent("Stopped");
  expect(screen.getByLabelText("Selected track")).toHaveTextContent("moonlight");
});

describe("server background music catalog", () => {
  const catalog = [
    { key: "moonlight", title: "Moonlight", url: "https://api.test/assets/audio/moonlight.mp3?v=v1", version: "v1" },
    { key: "seawaves", title: "Sea Waves", url: "https://api.test/assets/audio/seawaves.mp3?v=v1", version: "v1" },
  ];
  const withCatalog = (fetcher: () => Promise<unknown>) => (
    <SWRConfig value={{ fetcher, provider: () => new Map(), dedupingInterval: 0, shouldRetryOnError: false }}>
      <BackgroundMusicProvider><MusicControls /></BackgroundMusicProvider>
    </SWRConfig>
  );

  beforeEach(() => {
    savedMusic = "moonlight";
    accountId = "first-account";
    audioInstances.length = 0;
    vi.stubGlobal("Audio", MockAudio);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("plays tracks from the URLs the API returns", async () => {
    render(withCatalog(async () => ({ success: true, data: catalog })));
    await waitFor(() => expect(screen.getByLabelText("Track source")).toHaveTextContent(catalog[0].url));
    fireEvent.click(screen.getByText("Play track"));
    expect(audioInstances[0].src).toBe(catalog[1].url);
  });

  it("moves a restored track to its server URL without starting playback", async () => {
    render(withCatalog(async () => ({ success: true, data: catalog })));
    await waitFor(() => expect(audioInstances[0].src).toBe(catalog[0].url));
    expect(audioInstances[0].play).not.toHaveBeenCalled();
  });

  it("keeps the bundled tracks when the catalog is unavailable", async () => {
    render(withCatalog(async () => { throw new Error("offline"); }));
    fireEvent.click(screen.getByText("Play track"));
    expect(audioInstances[0].src).toBe("/audio/seawaves.mp3");
  });
});
