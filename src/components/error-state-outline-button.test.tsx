import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "@testing-library/react";
import { ErrorStateGoBackButton, ErrorStateOutlineButton } from "./error-state-outline-button";

describe("ErrorStateOutlineButton", () => {
  it("merges v3 outline layout classes", () => {
    render(<ErrorStateOutlineButton>Action</ErrorStateOutlineButton>);
    const btn = screen.getByRole("button", { name: "Action" });
    expect(btn).toHaveClass("btn-outline-v3");
    expect(btn.className).toContain("md:!py-[14px]");
  });

  it("forwards click handler", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<ErrorStateOutlineButton onClick={onClick}>Tap</ErrorStateOutlineButton>);
    await user.click(screen.getByRole("button", { name: "Tap" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("ErrorStateGoBackButton", () => {
  it("renders arrow and default label", () => {
    render(<ErrorStateGoBackButton onClick={() => {}} />);
    const btn = screen.getByRole("button", { name: /go back/i });
    expect(btn).toHaveClass("btn-outline-v3");
    expect(btn.className).toContain("md:!py-[14px]");
  });

  it("allows custom label", () => {
    render(<ErrorStateGoBackButton label="Return" onClick={() => {}} />);
    expect(screen.getByRole("button", { name: /return/i })).toBeInTheDocument();
  });
});
