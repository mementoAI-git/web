import { render } from "@testing-library/react";
import Spinner from "./spinner";

describe("Spinner", () => {
  it("returns null when loading=false (nothing in DOM)", () => {
    const { container } = render(<Spinner loading={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders SVG when loading=true", () => {
    render(<Spinner loading />);
    const svg = document.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
  });

  it("applies custom className", () => {
    render(<Spinner loading className="custom-spinner" />);
    const svg = document.querySelector("svg");
    expect(svg).toHaveClass("custom-spinner");
  });
});
