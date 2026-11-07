import { fireEvent, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test";
import VoicePlayer from "./voice-player";

function renderPlayer() {
  renderWithProviders(
    <VoicePlayer src="blob:clip" title="Voice note" duration={40} recordedAt={Date.now()} />,
  );
  const audio = screen.getByTestId("voice-player").querySelector("audio")!;
  audio.play = vi.fn().mockResolvedValue(undefined);
  return audio;
}

it("shows the length, when it was recorded and a zeroed clock", () => {
  renderPlayer();
  expect(screen.getByText(/00:40 · Today,/)).toBeInTheDocument();
  expect(screen.getByText("00:00.00")).toBeInTheDocument();
});

it("skips 15 seconds and won't go below the start", () => {
  const audio = renderPlayer();
  fireEvent.click(screen.getByRole("button", { name: "Skip forward 15 seconds" }));
  expect(audio.currentTime).toBe(15);
  expect(screen.getByText("00:15.00")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Skip back 15 seconds" }));
  fireEvent.click(screen.getByRole("button", { name: "Skip back 15 seconds" }));
  expect(audio.currentTime).toBe(0);
});

it("scrubs from the keyboard", () => {
  const audio = renderPlayer();
  fireEvent.keyDown(screen.getByRole("slider", { name: "Playback position" }), { key: "ArrowRight" });
  expect(audio.currentTime).toBe(5);
});

it("applies the chosen speed when playing", () => {
  const audio = renderPlayer();
  fireEvent.click(screen.getByRole("button", { name: "Playback speed 1x" }));
  fireEvent.click(screen.getByRole("button", { name: "Play" }));
  expect(audio.playbackRate).toBe(1.25);
  expect(audio.play).toHaveBeenCalledOnce();
});
