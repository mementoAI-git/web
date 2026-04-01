import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Textinput } from "./text-input";

describe("Textinput", () => {
  it("associates label with the input via htmlFor", () => {
    render(<Textinput label="Email" id="email-field" placeholder="you@example.com" />);
    expect(screen.getByLabelText(/^email/i)).toBeInTheDocument();
  });

  it("shows error copy and marks the control invalid", () => {
    render(<Textinput label="Email" error="Required" />);
    expect(screen.getByText("Required")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  });

  it("forwards typing to onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Textinput label="Name" onChange={onChange} />);
    await user.type(screen.getByRole("textbox"), "a");
    expect(onChange).toHaveBeenCalled();
  });

  it("renders trailing adornment", () => {
    render(<Textinput label="Field" end={<span data-testid="end">addon</span>} />);
    expect(screen.getByTestId("end")).toBeInTheDocument();
  });
});
