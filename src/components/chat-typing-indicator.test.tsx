import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChatTypingIndicator } from "./chat-typing-indicator";
import { ThemeProvider } from "@/contexts/theme";

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
});
afterEach(() => vi.restoreAllMocks());

describe("ChatTypingIndicator", () => {
  it("announces one steady thinking status and hides the decorative orb", () => {
    const { container } = render(
      <ThemeProvider>
        <ChatTypingIndicator />
      </ThemeProvider>,
    );
    expect(
      screen.getByRole("status", { name: "Memento is thinking" }),
    ).toHaveTextContent("Thinking…");
    const orb = container.querySelector("canvas");
    expect(orb).toHaveAttribute("aria-hidden", "true");
    // A 20px canvas shows a 16px ring; the -2px margin keeps a 16px footprint.
    expect(orb).toHaveStyle({ width: "20px", height: "20px", margin: "-2px" });
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("removes the waiting status when the reply arrives", () => {
    const { rerender } = render(
      <ThemeProvider>
        <ChatTypingIndicator />
      </ThemeProvider>,
    );
    rerender(
      <ThemeProvider>
        <p>Your reply</p>
      </ThemeProvider>,
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByText("Your reply")).toBeVisible();
  });
});
