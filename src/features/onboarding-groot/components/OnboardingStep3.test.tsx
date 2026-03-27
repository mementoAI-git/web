import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ONBOARDING_DIMENSION_OPTIONS } from "../types";
import { OnboardingStep3 } from "./OnboardingStep3";

const ALL_ONBOARDING_KEYS = ONBOARDING_DIMENSION_OPTIONS.map((o) => o.value);

describe("OnboardingStep3", () => {
  it("renders dimension cards", () => {
    render(
      <OnboardingStep3
        priorityDimensions={[]}
        onDimensionsChange={() => {}}
      />,
    );
    expect(screen.getByText(/relationships & people/i)).toBeInTheDocument();
    expect(screen.getByText(/memories & experiences/i)).toBeInTheDocument();
  });

  it("shows validation error when provided", () => {
    render(
      <OnboardingStep3
        priorityDimensions={[]}
        onDimensionsChange={() => {}}
        validationErrors={{ dimensions: "Even just one is a great place to start." }}
      />,
    );
    expect(screen.getByText(/even just one is a great place to start/i)).toBeInTheDocument();
  });

  it("toggles dimension on click", async () => {
    const user = userEvent.setup();
    const onDimensionsChange = vi.fn();
    render(
      <OnboardingStep3
        priorityDimensions={[]}
        onDimensionsChange={onDimensionsChange}
      />,
    );
    await user.click(screen.getByRole("button", { name: /relationships & people/i }));
    expect(onDimensionsChange).toHaveBeenCalledWith(["relationships_people"]);
  });

  it("removes dimension when clicking selected card", async () => {
    const user = userEvent.setup();
    const onDimensionsChange = vi.fn();
    render(
      <OnboardingStep3
        priorityDimensions={["relationships_people"]}
        onDimensionsChange={onDimensionsChange}
      />,
    );
    await user.click(screen.getByRole("button", { name: /relationships & people/i }));
    expect(onDimensionsChange).toHaveBeenCalledWith([]);
  });

  it("selects all dimensions when clicking All of the above", async () => {
    const user = userEvent.setup();
    const onDimensionsChange = vi.fn();
    render(
      <OnboardingStep3
        priorityDimensions={[]}
        onDimensionsChange={onDimensionsChange}
      />,
    );
    await user.click(screen.getByRole("button", { name: /all of the above/i }));
    expect(onDimensionsChange).toHaveBeenCalledTimes(1);
    const [arg] = onDimensionsChange.mock.calls[0];
    expect(arg).toHaveLength(ALL_ONBOARDING_KEYS.length);
  });

  it("clears all dimensions when clicking All of the above while all selected", async () => {
    const user = userEvent.setup();
    const onDimensionsChange = vi.fn();
    render(
      <OnboardingStep3
        priorityDimensions={[...ALL_ONBOARDING_KEYS]}
        onDimensionsChange={onDimensionsChange}
      />,
    );
    await user.click(screen.getByRole("button", { name: /all of the above/i }));
    expect(onDimensionsChange).toHaveBeenCalledWith([]);
  });
});
