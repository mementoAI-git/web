import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OnboardingStep4 } from "./OnboardingStep4";

describe("OnboardingStep4", () => {
  it("renders adaptive headline based on motivation", () => {
    render(
      <OnboardingStep4
        motivationType="emotional_depth"
        expressionMode={[]}
        onExpressionModeChange={() => {}}
      />
    );
    expect(screen.getByText(/how do you most naturally open up/i)).toBeInTheDocument();
  });

  it("renders different headline for memory_preservation", () => {
    render(
      <OnboardingStep4
        motivationType="memory_preservation"
        expressionMode={[]}
        onExpressionModeChange={() => {}}
      />
    );
    expect(screen.getByText(/how would you most like to add to your memento/i)).toBeInTheDocument();
  });

  it("renders subtext", () => {
    render(
      <OnboardingStep4
        motivationType={null}
        expressionMode={[]}
        onExpressionModeChange={() => {}}
      />
    );
    expect(screen.getByText(/we'll make sure that's the easiest way to get started/i)).toBeInTheDocument();
  });

  it("shows validation error when provided", () => {
    render(
      <OnboardingStep4
        motivationType={null}
        expressionMode={[]}
        onExpressionModeChange={() => {}}
        validationErrors={{ expression: "Pick at least one — you can always change it later." }}
      />
    );
    expect(screen.getByText(/pick at least one/i)).toBeInTheDocument();
  });

  it("allows selecting up to 2 expression modes", async () => {
    const user = userEvent.setup();
    const onExpressionModeChange = vi.fn();
    render(
      <OnboardingStep4
        motivationType={null}
        expressionMode={["voice"]}
        onExpressionModeChange={onExpressionModeChange}
      />
    );
    await user.click(screen.getByRole("button", { name: /writing — I like taking my time/i }));
    expect(onExpressionModeChange).toHaveBeenCalledWith(["voice", "writing"]);
  });

  it("disables unselected cards when max (2) selections reached", () => {
    const onExpressionModeChange = vi.fn();
    render(
      <OnboardingStep4
        motivationType={null}
        expressionMode={["voice", "writing"]}
        onExpressionModeChange={onExpressionModeChange}
      />
    );
    const photosButton = screen.getByRole("button", { name: /photos & videos/i });
    expect(photosButton).toBeDisabled();
  });

  it("selects all modes when clicking All of the above", async () => {
    const user = userEvent.setup();
    const onExpressionModeChange = vi.fn();
    render(
      <OnboardingStep4
        motivationType={null}
        expressionMode={[]}
        onExpressionModeChange={onExpressionModeChange}
      />
    );
    await user.click(screen.getByRole("button", { name: /all of the above/i }));
    expect(onExpressionModeChange).toHaveBeenCalledWith([
      "voice",
      "writing",
      "media",
      "guided",
    ]);
  });

  it("clears all modes when clicking All of the above while all selected", async () => {
    const user = userEvent.setup();
    const onExpressionModeChange = vi.fn();
    render(
      <OnboardingStep4
        motivationType={null}
        expressionMode={["voice", "writing", "guided", "media"]}
        onExpressionModeChange={onExpressionModeChange}
      />
    );
    await user.click(screen.getByRole("button", { name: /all of the above/i }));
    expect(onExpressionModeChange).toHaveBeenCalledWith([]);
  });

  it("does not disable individual cards when All of the above is selected", () => {
    render(
      <OnboardingStep4
        motivationType={null}
        expressionMode={["voice", "writing", "guided", "media"]}
        onExpressionModeChange={() => {}}
      />
    );
    const photosButton = screen.getByRole("button", { name: /photos & videos/i });
    expect(photosButton).not.toBeDisabled();
  });
});
