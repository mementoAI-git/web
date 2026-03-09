import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Switch from "./switch";

describe("Switch", () => {
  it("renders without crashing", () => {
    render(<Switch />);
    expect(document.querySelector(".rounded-full")).toBeInTheDocument();
  });

  it("calls onCheckedChange with !checked when clicked", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    const { container } = render(<Switch checked={false} onCheckedChange={onCheckedChange} />);
    const switchEl = container.querySelector(".cursor-pointer");
    await user.click(switchEl as HTMLElement);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("does NOT call onCheckedChange when disabled", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    const { container } = render(<Switch checked={false} onCheckedChange={onCheckedChange} disabled />);
    const switchEl = container.firstElementChild;
    await user.click(switchEl as HTMLElement);
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it("applies correct CSS classes based on checked state", () => {
    const { container, rerender } = render(<Switch checked={false} />);
    const root = container.firstElementChild;
    expect(root).toHaveClass("bg-gray-300");
    expect(root).not.toHaveClass("bg-blue-6");

    rerender(<Switch checked />);
    expect(root).toHaveClass("bg-blue-6");
    expect(root).not.toHaveClass("bg-gray-300");
  });
});
