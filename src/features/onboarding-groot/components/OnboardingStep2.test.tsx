import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OnboardingStep2 } from "./OnboardingStep2";

describe("OnboardingStep2", () => {
  it("renders motivation cards", () => {
    render(
      <OnboardingStep2
        motivationType={null}
        onMotivationSelect={() => {}}
      />
    );
    expect(screen.getByText(/people I love to truly know me/i)).toBeInTheDocument();
    expect(screen.getByText(/memories I'm afraid of losing/i)).toBeInTheDocument();
  });

  it("shows validation error when provided", () => {
    render(
      <OnboardingStep2
        motivationType={null}
        onMotivationSelect={() => {}}
        validationErrors={{ motivation: "Please choose the one that feels most like you." }}
      />
    );
    expect(screen.getByText(/please choose the one that feels most like you/i)).toBeInTheDocument();
  });

  it("calls onMotivationSelect when card is clicked", async () => {
    const user = userEvent.setup();
    const onMotivationSelect = vi.fn();
    render(
      <OnboardingStep2
        motivationType={null}
        onMotivationSelect={onMotivationSelect}
      />
    );
    await user.click(screen.getByRole("button", { name: /people I love to truly know me/i }));
    expect(onMotivationSelect).toHaveBeenCalledWith("emotional_depth");
  });
});
