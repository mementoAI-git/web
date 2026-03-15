import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OnboardSelectionCard } from "./OnboardSelectionCard";

describe("OnboardSelectionCard", () => {
  it("renders label and icon", () => {
    render(
      <OnboardSelectionCard
        value="under_30"
        label="Under 30"
        icon="🌱"
        isSelected={false}
        onClick={() => {}}
      />
    );
    expect(screen.getByText("Under 30")).toBeInTheDocument();
    expect(screen.getByText("🌱")).toBeInTheDocument();
  });

  it("calls onClick with value when clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <OnboardSelectionCard
        value="under_30"
        label="Under 30"
        icon="🌱"
        isSelected={false}
        onClick={onClick}
      />
    );
    await user.click(screen.getByRole("button", { name: /under 30/i }));
    expect(onClick).toHaveBeenCalledWith("under_30");
  });

  it("has aria-pressed true when selected", () => {
    render(
      <OnboardSelectionCard
        value="under_30"
        label="Under 30"
        icon="🌱"
        isSelected={true}
        onClick={() => {}}
      />
    );
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("applies brand orange styling when selected", () => {
    render(
      <OnboardSelectionCard
        value="under_30"
        label="Under 30"
        icon="🌱"
        isSelected={true}
        onClick={() => {}}
      />
    );
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-[#E26A24]/[0.06]");
    expect(button).toHaveClass("border-[#E26A24]/20");
  });

  it("does not apply selected styling when not selected", () => {
    render(
      <OnboardSelectionCard
        value="under_30"
        label="Under 30"
        icon="🌱"
        isSelected={false}
        onClick={() => {}}
      />
    );
    const button = screen.getByRole("button");
    expect(button).not.toHaveClass("bg-[#E26A24]/[0.06]");
    expect(button).not.toHaveClass("border-[#E26A24]/20");
    expect(button).toHaveClass("border-gray-200");
    expect(button).toHaveClass("bg-white");
  });

  it("applies grey add variant styling and hides icon when variant is add", () => {
    render(
      <OnboardSelectionCard
        value="something_else"
        label="Add something else"
        isSelected={false}
        onClick={() => {}}
        variant="add"
      />
    );
    const button = screen.getByRole("button");
    expect(button).toHaveClass("border-black/[0.12]");
    expect(button).toHaveClass("bg-black/[0.04]");
    expect(screen.queryByText("✨")).not.toBeInTheDocument();
    expect(screen.getByText("Add something else")).toBeInTheDocument();
  });
});
