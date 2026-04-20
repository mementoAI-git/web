import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChatPreferencesPanel } from "./chat-preferences-panel";

vi.mock("./background-music", () => ({ default: () => <div data-testid="bgm" /> }));
vi.mock("./voices", () => ({ default: () => <div data-testid="voices" /> }));
vi.mock("./upgrade-plan", () => ({ default: () => <div data-testid="upgrade" /> }));

describe("ChatPreferencesPanel", () => {
  it("fills available width and height for compact sidebar usage", () => {
    const { container } = render(
      <ChatPreferencesPanel density="compact" className="min-h-0 flex-1 pb-4" />,
    );
    const root = container.firstElementChild;
    expect(root?.className).toContain("w-full");
    expect(root?.className).toContain("h-full");
  });
});
