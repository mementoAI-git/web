import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import VideoPlayer from "./video-player";

describe("video player controls", () => {
  it("names icon actions and updates play and mute states", async () => {
    const { container } = render(<VideoPlayer src="/video.mp4" autoPlay={false} />);
    expect(screen.getByRole("button", { name: "Play video" })).toBeInTheDocument();
    fireEvent.play(container.querySelector("video")!);
    expect(screen.getByRole("button", { name: "Pause video" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Mute video" }));
    expect(screen.getByRole("button", { name: "Unmute video" })).toBeInTheDocument();
  });

  it("exposes the selected playback speed", async () => {
    const { container } = render(<VideoPlayer src="/video.mp4" autoPlay={false} />);
    expect(screen.getByRole("button", { name: "Playback speed 1x" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(screen.getByRole("button", { name: "Playback speed 2x" }));
    expect(screen.getByRole("button", { name: "Playback speed 2x" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Playback speed 1x" })).toHaveAttribute("aria-pressed", "false");
    expect(container.querySelector("video")!.playbackRate).toBe(2);
  });
});
