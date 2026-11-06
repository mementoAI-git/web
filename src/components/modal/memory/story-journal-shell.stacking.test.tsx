import { screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test";
import { StoryJournalShell } from "./story-journal-shell";

const modal = vi.hoisted(() => ({ state: [] as { name: string }[] }));
vi.mock("@/hooks/use-modal", async (original) => ({
  ...(await original<typeof import("@/hooks/use-modal")>()),
  useModal: () => ({ state: modal.state }),
}));

it.each([
  ["stays on top with Insights waiting underneath", ["view-memory", "memory-insights"], "z-[110]"],
  ["stays on top when nothing else is open", ["view-memory"], "z-[110]"],
  ["steps back for a dialog opened above it", ["share-memory", "view-memory"], "z-[95]"],
])("%s", (_name, names, layer) => {
  modal.state = names.map((name) => ({ name }));
  renderWithProviders(
    <StoryJournalShell presentation="overlay-b">
      <div>Story content</div>
    </StoryJournalShell>,
  );
  expect(screen.getByTestId("desktop-journal-shell")).toHaveClass(layer);
});
