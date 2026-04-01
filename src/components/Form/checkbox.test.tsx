import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Checkbox } from "./checkbox";

describe("Checkbox", () => {
  it("fires onChange with a checkbox-like event when toggled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Checkbox label="Remember me" name="remember" checked={false} onChange={onChange} />);

    await user.click(screen.getByRole("checkbox"));
    expect(onChange).toHaveBeenCalledTimes(1);
    const ev = onChange.mock.calls[0][0];
    expect(ev.target.checked).toBe(true);
    expect(ev.target.name).toBe("remember");
    expect(ev.target.type).toBe("checkbox");
  });

  it("exposes label text for the control", () => {
    render(<Checkbox label="Accept terms" checked={false} onChange={vi.fn()} />);
    expect(screen.getByLabelText(/accept terms/i)).toBeInTheDocument();
  });
});
