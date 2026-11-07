import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { renderWithProviders } from "@/test";
import { VoiceNoteTile } from "./voice-note-tile";

const play = vi.fn().mockResolvedValue(undefined);
beforeEach(() => {
  play.mockClear();
  vi.stubGlobal(
    "Audio",
    class extends EventTarget {
      paused = true;
      currentTime = 0;
      play = () => {
        this.paused = false;
        this.dispatchEvent(new Event("play"));
        return play();
      };
      pause = () => {
        this.paused = true;
        this.dispatchEvent(new Event("pause"));
      };
    },
  );
});

const tile = (props = {}) => (
  <VoiceNoteTile id="clip" src="blob:clip" duration={8} label="Voice note" {...props} />
);

it("plays in place without opening the viewer", () => {
  const onOpen = vi.fn();
  renderWithProviders(tile({ onOpen }));
  expect(screen.getByText("0:08")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Play voice note" }));
  expect(play).toHaveBeenCalledOnce();
  expect(onOpen).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Pause voice note" })).toBeInTheDocument();
});

it("opens the viewer from the tile and removes from the corner", () => {
  const onOpen = vi.fn();
  const onRemove = vi.fn();
  renderWithProviders(tile({ onOpen, onRemove }));
  fireEvent.click(screen.getByRole("button", { name: "Open Voice note" }));
  expect(onOpen).toHaveBeenCalledOnce();
  fireEvent.click(screen.getByRole("button", { name: "Remove voice note" }));
  expect(onRemove).toHaveBeenCalledOnce();
  expect(onOpen).toHaveBeenCalledOnce();
});

it("adds no buttons when a parent control already opens the clip", () => {
  renderWithProviders(tile({ interactive: false, onOpen: vi.fn() }));
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});

it("says so instead of silently doing nothing when there's nothing to play", () => {
  const error = vi.spyOn(toast, "error");
  renderWithProviders(tile({ src: "" }));
  fireEvent.click(screen.getByRole("button", { name: "Play voice note" }));
  expect(play).not.toHaveBeenCalled();
  expect(error).toHaveBeenCalledWith("This recording isn’t ready to play yet.");
});

it("plays the local recording while it has no uploaded link", () => {
  URL.createObjectURL = vi.fn(() => "blob:local");
  URL.revokeObjectURL = vi.fn();
  renderWithProviders(tile({ src: "", localFile: new File(["a"], "a.webm", { type: "audio/webm" }) }));
  fireEvent.click(screen.getByRole("button", { name: "Play voice note" }));
  expect(play).toHaveBeenCalledOnce();
});

it("offers a retry when the upload failed", () => {
  const onRetry = vi.fn();
  renderWithProviders(tile({ onRetry }));
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(onRetry).toHaveBeenCalledOnce();
});
