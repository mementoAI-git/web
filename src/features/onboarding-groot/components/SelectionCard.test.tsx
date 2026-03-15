import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SelectionCard } from "./SelectionCard";

describe("SelectionCard", () => {
  it("renders label, sublabel, and icon", () => {
    render(
      <SelectionCard
        value="family"
        label="Family memories"
        sublabel="Stories for your loved ones"
        icon="🌿"
        isSelected={false}
        onClick={() => {}}
      />
    );
    expect(screen.getByText("Family memories")).toBeInTheDocument();
    expect(screen.getByText("Stories for your loved ones")).toBeInTheDocument();
    expect(screen.getByText("🌿")).toBeInTheDocument();
  });

  it("renders without sublabel", () => {
    render(
      <SelectionCard
        value="family"
        label="Family memories"
        icon="🌿"
        isSelected={false}
        onClick={() => {}}
      />
    );
    expect(screen.getByText("Family memories")).toBeInTheDocument();
    expect(screen.queryByText("Stories for your loved ones")).not.toBeInTheDocument();
  });

  it("calls onClick with value when clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <SelectionCard
        value="family"
        label="Family memories"
        icon="🌿"
        isSelected={false}
        onClick={onClick}
      />
    );
    await user.click(screen.getByRole("button", { name: /family memories/i }));
    expect(onClick).toHaveBeenCalledWith("family");
  });

  it("shows checkmark when selected", () => {
    render(
      <SelectionCard
        value="family"
        label="Family memories"
        icon="🌿"
        isSelected={true}
        onClick={() => {}}
      />
    );
    const checkmark = screen.getByText("✓");
    expect(checkmark).toBeInTheDocument();
    expect(checkmark.closest("span")).toHaveClass("bg-[#E26A24]");
  });

  it("does not show checkmark when not selected", () => {
    render(
      <SelectionCard
        value="family"
        label="Family memories"
        icon="🌿"
        isSelected={false}
        onClick={() => {}}
      />
    );
    expect(screen.queryByText("✓")).not.toBeInTheDocument();
  });

  it("does not call onClick when disabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <SelectionCard
        value="family"
        label="Family memories"
        icon="🌿"
        isSelected={false}
        onClick={onClick}
        disabled
      />
    );
    const button = screen.getByRole("button", { name: /family memories/i });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("has aria-pressed when selected", () => {
    render(
      <SelectionCard
        value="family"
        label="Family memories"
        icon="🌿"
        isSelected={true}
        onClick={() => {}}
      />
    );
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("has aria-pressed false when not selected", () => {
    render(
      <SelectionCard
        value="family"
        label="Family memories"
        icon="🌿"
        isSelected={false}
        onClick={() => {}}
      />
    );
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
  });

  it("activates on Enter key", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <SelectionCard
        value="family"
        label="Family memories"
        icon="🌿"
        isSelected={false}
        onClick={onClick}
      />
    );
    screen.getByRole("button").focus();
    await user.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledWith("family");
  });

  it("activates on Space key", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <SelectionCard
        value="family"
        label="Family memories"
        icon="🌿"
        isSelected={false}
        onClick={onClick}
      />
    );
    screen.getByRole("button").focus();
    await user.keyboard(" ");
    expect(onClick).toHaveBeenCalledWith("family");
  });
});
