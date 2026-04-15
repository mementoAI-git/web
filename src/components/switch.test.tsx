import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Switch from "./switch";

describe("Switch", () => {
  it("renders an accessible switch", () => {
    render(<Switch />);
    expect(screen.getByRole("switch")).toBeInTheDocument();
  });

  it("calls onCheckedChange with true when toggled from off", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Switch checked={false} onCheckedChange={onCheckedChange} />);
    await user.click(screen.getByRole("switch"));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("does not call onCheckedChange when disabled", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Switch checked={false} onCheckedChange={onCheckedChange} disabled />);
    await user.click(screen.getByRole("switch"));
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it("reflects checked state", () => {
    const { rerender } = render(<Switch checked={false} />);
    expect(screen.getByRole("switch")).toHaveAttribute("data-state", "unchecked");
    rerender(<Switch checked />);
    expect(screen.getByRole("switch")).toHaveAttribute("data-state", "checked");
  });
});
