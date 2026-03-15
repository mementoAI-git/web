import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OnboardingStep5 } from "./OnboardingStep5";

describe("OnboardingStep5", () => {
  it("renders headline with displayName", () => {
    render(
      <OnboardingStep5
        displayName="Jane"
        motivationType={null}
        onSecondaryLink={() => {}}
      />
    );
    expect(screen.getByText(/you're all set, jane. let's begin/i)).toBeInTheDocument();
  });

  it("renders adaptive body based on motivation", () => {
    render(
      <OnboardingStep5
        displayName="Jane"
        motivationType="emotional_depth"
        onSecondaryLink={() => {}}
      />
    );
    expect(screen.getByText(/start with something that matters to you/i)).toBeInTheDocument();
  });

  it("renders secondary link", () => {
    render(
      <OnboardingStep5
        displayName="Jane"
        motivationType="explorer"
        onSecondaryLink={() => {}}
      />
    );
    expect(screen.getByRole("button", { name: /or take me to the dashboard/i })).toBeInTheDocument();
  });

  it("calls onSecondaryLink when secondary link clicked", async () => {
    const user = userEvent.setup();
    const onSecondaryLink = vi.fn();
    render(
      <OnboardingStep5
        displayName="Jane"
        motivationType={null}
        onSecondaryLink={onSecondaryLink}
      />
    );
    await user.click(screen.getByRole("button", { name: /or take me to the dashboard/i }));
    expect(onSecondaryLink).toHaveBeenCalled();
  });
});
