import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import BackgroundMusic from "./background-music";

const setVolume = vi.fn();
const playTrack = vi.fn();
const trigger = vi.fn();
let emptyCatalog = false;
let currentTrack: string | null = "moonlight";
let mockBackgroundMusic: string | null = "moonlight";

vi.mock("swr", async (importOriginal) => {
  const actual = await importOriginal<typeof import("swr")>();
  return { ...actual, mutate: vi.fn() };
});

vi.mock("@/hooks/use-background-music", () => ({
  useBackgroundMusic: () => ({
    isPlaying: false,
    currentTrack,
    volume: 50,
    setVolume,
    playTrack,
    pauseTrack: vi.fn(),
    resumeTrack: vi.fn(),
    stopTrack: vi.fn(),
    audioFiles: emptyCatalog ? [] : [
      { title: "Moonlight", key: "moonlight", file: "/audio/moonlight.mp3" },
      { title: "Sea Waves", key: "seawaves", file: "/audio/seawaves.mp3" },
    ],
  }),
}));

vi.mock("@/hooks/use-store", () => ({
  useStore: () => ({
    user: { bg_music: mockBackgroundMusic },
    setUser: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-fetcher", () => ({
  default: () => ({ isMutating: false, trigger }),
}));

afterEach(() => vi.unstubAllGlobals());

describe("BackgroundMusic", () => {
  it.each(["Next track", "Previous track"])("cycles tracks using %s in the compact player", async (label) => {
    const user = await import("@testing-library/user-event").then(({ default: userEvent }) => userEvent.setup());
    render(<BackgroundMusic compact />);
    expect(screen.queryByRole("button", { name: /off no tune/i })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: label }));
    expect(trigger).toHaveBeenCalledWith({ bg_music: "seawaves" });
    expect(playTrack).toHaveBeenCalledWith("seawaves");
  });

  it("explains an empty catalog and disables compact playback", () => {
    emptyCatalog = true;
    render(<BackgroundMusic compact />);
    expect(screen.getByText("No music available")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play music" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next track" })).toBeDisabled();
  });

  it("explains an empty ambience list while keeping Off available", () => {
    emptyCatalog = true;
    render(<BackgroundMusic />);
    expect(screen.getByText("No background tracks are available.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Off No tune" })).toBeEnabled();
  });

  it("prevents overlapping preference saves on rapid track clicks", async () => {
    let release!: () => void;
    trigger.mockImplementationOnce(() => new Promise<{ success: boolean }>((resolve) => { release = () => resolve({ success: true }); }));
    const user = await import("@testing-library/user-event").then(({ default: userEvent }) => userEvent.setup());
    render(<BackgroundMusic />);
    const track = screen.getByRole("button", { name: /Sea Waves/ });
    await user.click(track);
    await user.click(track);
    expect(trigger).toHaveBeenCalledTimes(1);
    release();
  });

  it("starts the saved track after stopping", async () => {
    currentTrack = null;
    mockBackgroundMusic = "seawaves";
    const user = await import("@testing-library/user-event").then(({ default: userEvent }) => userEvent.setup());
    render(<BackgroundMusic compact />);
    expect(screen.getByText("Sea Waves")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Play music" }));
    expect(playTrack).toHaveBeenCalledWith("seawaves");
  });

  it("can start music when no track was previously selected", async () => {
    currentTrack = null;
    mockBackgroundMusic = null;
    const user = await import("@testing-library/user-event").then(({ default: userEvent }) => userEvent.setup());
    render(<BackgroundMusic compact />);
    await user.click(screen.getByRole("button", { name: "Play music" }));
    expect(playTrack).toHaveBeenCalledWith("moonlight");
  });

  beforeEach(() => {
    vi.clearAllMocks();
    trigger.mockResolvedValue({ success: true });
    emptyCatalog = false;
    currentTrack = "moonlight";
    mockBackgroundMusic = "moonlight";
    vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  });

  it("shows Background Ambience with Off as an explicit choice", () => {
    render(<BackgroundMusic />);

    expect(screen.getByText(/background ambience/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^off no tune$/i })).toBeVisible();
  });

  it("stacks track title and subtitle in a column inside each track button", () => {
    render(<BackgroundMusic />);
    const title = screen.getByText("Moonlight");
    expect(title.parentElement).toHaveClass("flex", "flex-col");
  });

  it("renders the Fluid volume slider and supports keyboard adjustment", async () => {
    setVolume.mockClear();
    const user = await import("@testing-library/user-event").then(({ default: userEvent }) => userEvent.setup());
    render(<BackgroundMusic />);

    const slider = screen.getByRole("slider", { name: /^volume$/i });
    expect(slider).toHaveAttribute("aria-valuenow", "50");
    expect(slider).toHaveAttribute("min", "0");
    expect(slider).toHaveAttribute("max", "100");
    slider.focus();
    await user.keyboard("{ArrowRight}");
    expect(setVolume).toHaveBeenCalledWith(51);
    await user.keyboard("{Home}");
    expect(setVolume).toHaveBeenLastCalledWith(0);
    await user.keyboard("{End}");
    expect(setVolume).toHaveBeenLastCalledWith(100);
  });

  it("keeps track cards visually available when ambience is off", () => {
    mockBackgroundMusic = null;
    render(<BackgroundMusic />);

    const moonlight = screen.getByRole("button", { name: /moonlight.*tune 1/i });
    expect(moonlight).toBeEnabled();
    expect(moonlight).toHaveClass(
      "cursor-pointer",
      "border-stroke-neutral-weak",
      "bg-background",
      "text-text-neutral-strong",
    );
    expect(moonlight).not.toHaveClass("opacity-70", "opacity-50");
  });
});
