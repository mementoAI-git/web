import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BackgroundMusic from "./background-music";

const setVolume = vi.fn();
let mockBackgroundMusic: string | null = "moonlight";

vi.mock("swr", async (importOriginal) => {
  const actual = await importOriginal<typeof import("swr")>();
  return { ...actual, mutate: vi.fn() };
});

vi.mock("@/hooks/use-background-music", () => ({
  useBackgroundMusic: () => ({
    isPlaying: false,
    currentTrack: "moonlight",
    volume: 50,
    setVolume,
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
    user: { bg_music: mockBackgroundMusic },
    setUser: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-fetcher", () => ({
  default: () => ({ isMutating: false, trigger: vi.fn() }),
}));

describe("BackgroundMusic", () => {
  beforeEach(() => {
    mockBackgroundMusic = "moonlight";
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

  it("renders the Figma volume track and supports keyboard adjustment", async () => {
    setVolume.mockClear();
    const user = await import("@testing-library/user-event").then(({ default: userEvent }) => userEvent.setup());
    render(<BackgroundMusic />);

    const slider = screen.getByRole("slider", { name: /background ambience volume/i });
    expect(slider).toHaveClass("h-5");
    expect(screen.getByTestId("ambience-volume-marker")).toHaveClass("w-px", "h-2.5");
    await user.click(slider);
    await user.keyboard("{ArrowRight}");
    expect(setVolume).toHaveBeenCalledWith(51);
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
