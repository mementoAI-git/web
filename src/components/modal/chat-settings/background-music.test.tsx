import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BackgroundMusic from "./background-music";

vi.mock("swr", async (importOriginal) => {
  const actual = await importOriginal<typeof import("swr")>();
  return { ...actual, mutate: vi.fn() };
});

vi.mock("@/hooks/use-background-music", () => ({
  useBackgroundMusic: () => ({
    isPlaying: false,
    currentTrack: "moonlight",
    volume: 50,
    setVolume: vi.fn(),
    playTrack: vi.fn(),
    pauseTrack: vi.fn(),
    resumeTrack: vi.fn(),
    stopTrack: vi.fn(),
    audioFiles: [
      { title: "Moonlight", key: "moonlight", file: "/audio/moonlight.mp3" },
      { title: "Sea Waves", key: "seawaves", file: "/audio/seawaves.mp3" },
    ],
  }),
}));

vi.mock("@/hooks/use-store", () => ({
  useStore: () => ({
    user: { bg_music: "moonlight" },
    setUser: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-fetcher", () => ({
  default: () => ({ isMutating: false, trigger: vi.fn() }),
}));

describe("BackgroundMusic", () => {
  it("shows the on/off switch for background music", () => {
    render(<BackgroundMusic />);

    expect(screen.getByText(/background music/i)).toBeInTheDocument();
    const toggle = screen.getByRole("switch", { name: /turn background music on or off/i });
    expect(toggle).toBeVisible();
    expect(toggle).toBeChecked();
  });

  it("stacks track title and subtitle in a column inside each track button", () => {
    render(<BackgroundMusic />);
    const title = screen.getByText("Moonlight");
    expect(title.parentElement).toHaveClass("flex", "flex-col");
  });
});
