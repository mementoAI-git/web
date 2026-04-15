import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { OnboardingShell } from "./OnboardingShell";

function renderShell(props: Partial<React.ComponentProps<typeof OnboardingShell>> = {}) {
  const defaultProps: React.ComponentProps<typeof OnboardingShell> = {
    currentStep: 2,
    totalSteps: 5,
    stepLabel: "Getting to know you",
    canAdvance: true,
    onAdvance: vi.fn(),
    onBack: vi.fn(),
    onSkip: vi.fn(),
    children: <div>Step content</div>,
  };
  return render(
    <MemoryRouter>
      <OnboardingShell {...defaultProps} {...props} />
    </MemoryRouter>
  );
}

describe("OnboardingShell", () => {
  it("renders step dots and label", () => {
    renderShell({ currentStep: 2, stepLabel: "Getting to know you" });
    expect(screen.getByText("Getting to know you")).toBeInTheDocument();
    const dots = document.querySelectorAll(".rounded-full");
    expect(dots.length).toBe(5);
  });

  it("hides Back when showBack is false", () => {
    renderShell({ showBack: false });
    expect(screen.queryByText("← Back")).not.toBeInTheDocument();
  });

  it("shows Back when showBack is true", () => {
    renderShell({ showBack: true });
    expect(screen.getByText("← Back")).toBeInTheDocument();
  });

  it("hides Skip when showSkip is false", () => {
    renderShell({ showSkip: false });
    expect(screen.queryByText("Skip for now →")).not.toBeInTheDocument();
  });

  it("shows Skip when showSkip is true", () => {
    renderShell({ showSkip: true });
    expect(screen.getByText("Skip for now →")).toBeInTheDocument();
  });

  it("disables Continue when canAdvance is false", () => {
    renderShell({ canAdvance: false });
    const continueBtn = screen.getByRole("button", { name: /continue/i });
    expect(continueBtn).toBeDisabled();
  });

  it("enables Continue when canAdvance is true", () => {
    renderShell({ canAdvance: true });
    const continueBtn = screen.getByRole("button", { name: /continue/i });
    expect(continueBtn).not.toBeDisabled();
  });

  it("calls onAdvance when Continue is clicked", async () => {
    const user = userEvent.setup();
    const onAdvance = vi.fn();
    renderShell({ onAdvance });
    await user.click(screen.getByRole("button", { name: /continue/i }));
    expect(onAdvance).toHaveBeenCalledTimes(1);
  });

  it("calls onBack when Back is clicked", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    renderShell({ onBack, showBack: true });
    await user.click(screen.getByText("← Back"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("calls onSkip when Skip is clicked", async () => {
    const user = userEvent.setup();
    const onSkip = vi.fn();
    renderShell({ onSkip });
    await user.click(screen.getByText("Skip for now →"));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it("uses custom advanceLabel", () => {
    renderShell({ advanceLabel: "Almost there →" });
    expect(screen.getByRole("button", { name: /almost there/i })).toBeInTheDocument();
  });

  it("renders children in content area", () => {
    renderShell({ children: <div data-testid="step-content">Custom step</div> });
    expect(screen.getByTestId("step-content")).toHaveTextContent("Custom step");
  });

  it("has role main and aria-label for accessibility", () => {
    renderShell();
    const main = document.querySelector('[role="main"][aria-label="Onboarding"]');
    expect(main).toBeInTheDocument();
  });
});
