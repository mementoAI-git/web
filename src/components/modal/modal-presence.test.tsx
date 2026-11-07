import { act, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { useModal } from "@/hooks/use-modal";

vi.mock("./memory", async () => {
  const { useModalClosing: closingFlag } = await import("./modal-presence");
  const Stub = () => null;
  return {
    BookmarkMemory: Stub,
    CreateMemory: Stub,
    QuickCapture: Stub,
    DeleteMemory: Stub,
    UpdateMemory: Stub,
    ViewMemoryDetails: Stub,
    ViewMemory: function StoryStub() {
      const closing = closingFlag();
      return <div data-testid="story" data-closing={String(closing)} />;
    },
  };
});

import Modal from ".";

let controls: ReturnType<typeof useModal>;
function Controls() {
  controls = useModal();
  return null;
}

describe("story overlay close animation", () => {
  it("keeps the same story mounted while it animates out, then removes it", () => {
    vi.useFakeTimers();
    try {
      renderWithProviders(<><Controls /><Modal /></>, { auth: true });
      act(() => controls.push?.("view-memory", { memoryId: "abc" }));
      const story = screen.getByTestId("story");
      expect(story).toHaveAttribute("data-closing", "false");

      act(() => controls.close?.("view-memory", { force: true }));
      // Same element, not a remount, now told to close its dialog.
      expect(screen.getByTestId("story")).toBe(story);
      expect(story).toHaveAttribute("data-closing", "true");

      act(() => vi.advanceTimersByTime(250));
      expect(screen.queryByTestId("story")).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("cancels the close when the story is opened again", () => {
    vi.useFakeTimers();
    try {
      renderWithProviders(<><Controls /><Modal /></>, { auth: true });
      act(() => controls.push?.("view-memory", { memoryId: "abc" }));
      act(() => controls.close?.("view-memory", { force: true }));
      act(() => controls.push?.("view-memory", { memoryId: "abc" }));
      act(() => vi.advanceTimersByTime(250));
      expect(screen.getAllByTestId("story")).toHaveLength(1);
      expect(screen.getByTestId("story")).toHaveAttribute("data-closing", "false");
    } finally {
      vi.useRealTimers();
    }
  });
});
