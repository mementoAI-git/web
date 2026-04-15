import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Spinner from "./spinner";

describe("Spinner", () => {
  it("returns null when loading=false (nothing in DOM)", () => {
    const { container } = render(<Spinner loading={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders loading indicator when loading=true", () => {
    render(<Spinner loading />);
    expect(screen.getByRole("status", { name: /loading/i })).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<Spinner loading className="custom-spinner" />);
    const el = screen.getByRole("status", { name: /loading/i });
    expect(el).toHaveClass("custom-spinner");
  });
});
