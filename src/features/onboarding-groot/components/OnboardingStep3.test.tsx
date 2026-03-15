import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DIMENSION_OPTIONS } from "../types";
import { OnboardingStep3 } from "./OnboardingStep3";

const ALL_DIMENSION_KEYS = DIMENSION_OPTIONS.map((o) => o.value);

describe("OnboardingStep3", () => {
  it("renders dimension cards", () => {
    render(
      <OnboardingStep3
        priorityDimensions={[]}
        onDimensionsChange={() => {}}
      />
    );
    expect(screen.getByText(/family & relationships/i)).toBeInTheDocument();
    expect(screen.getByText(/stories & adventures/i)).toBeInTheDocument();
  });

  it("shows validation error when provided", () => {
    render(
      <OnboardingStep3
        priorityDimensions={[]}
        onDimensionsChange={() => {}}
        validationErrors={{ dimensions: "Even just one is a great place to start." }}
      />
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
      />
    );
    await user.click(screen.getByRole("button", { name: /family & relationships/i }));
    expect(onDimensionsChange).toHaveBeenCalledWith(["people_relationships"]);
  });

  it("removes dimension when clicking selected card", async () => {
    const user = userEvent.setup();
    const onDimensionsChange = vi.fn();
    render(
      <OnboardingStep3
        priorityDimensions={["people_relationships"]}
        onDimensionsChange={onDimensionsChange}
      />
    );
    await user.click(screen.getByRole("button", { name: /family & relationships/i }));
    expect(onDimensionsChange).toHaveBeenCalledWith([]);
  });

  it("selects all dimensions when clicking All of the above", async () => {
    const user = userEvent.setup();
    const onDimensionsChange = vi.fn();
    render(
      <OnboardingStep3
        priorityDimensions={[]}
        onDimensionsChange={onDimensionsChange}
      />
    );
    await user.click(screen.getByRole("button", { name: /all of the above/i }));
    expect(onDimensionsChange).toHaveBeenCalledTimes(1);
    const [arg] = onDimensionsChange.mock.calls[0];
    expect(arg).toHaveLength(ALL_DIMENSION_KEYS.length);
  });

  it("clears all dimensions when clicking All of the above while all selected", async () => {
    const user = userEvent.setup();
    const onDimensionsChange = vi.fn();
    render(
      <OnboardingStep3
        priorityDimensions={[...ALL_DIMENSION_KEYS]}
        onDimensionsChange={onDimensionsChange}
      />
    );
    await user.click(screen.getByRole("button", { name: /all of the above/i }));
    expect(onDimensionsChange).toHaveBeenCalledWith([]);
  });
});
