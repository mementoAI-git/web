import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Passwordinput } from "./password-input";

describe("Passwordinput", () => {
  it("uses password type by default and toggles visibility with the control", async () => {
    const user = userEvent.setup();
    render(<Passwordinput label="Password" />);
    const field = screen.getByLabelText(/^password$/i);
    expect(field).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: /show password/i }));
    expect(field).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: /hide password/i }));
    expect(field).toHaveAttribute("type", "password");
  });
});
