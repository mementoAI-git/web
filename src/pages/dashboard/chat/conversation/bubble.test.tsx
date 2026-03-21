import { render, screen } from "@testing-library/react";
import Bubble from "./bubble";

describe("Bubble", () => {
  it("has no fill background on AI message body", () => {
    render(<Bubble role="ai" text="Hello from the assistant" />);

    expect(screen.getByText("Hello from the assistant")).toBeInTheDocument();
    const bubble = screen.getByText("Hello from the assistant").closest("div.w-full");
    expect(bubble).toBeInTheDocument();
    expect(bubble?.className.includes("bg-v3-fill-weak")).toBe(false);
  });

  it("uses v3 fill weak for user messages", () => {
    render(<Bubble role="user" text="User said this" />);

    const bubble = screen.getByText("User said this").closest(".bg-v3-fill-weak");
    expect(bubble).toBeInTheDocument();
  });

  it("caps user message body width at 470px", () => {
    render(<Bubble role="user" text="User said this" />);
    const body = screen.getByText("User said this").closest("div.rounded-\\[8px\\]");
    expect(body?.className).toContain("max-w-[470px]");
  });

  it("uses 8px padding and radius on message bodies", () => {
    render(<Bubble role="user" text="Hi" />);
    const body = screen.getByText("Hi").closest("div.rounded-\\[8px\\]");
    expect(body).toBeInTheDocument();
    expect(body?.className).toMatch(/\bp-2\b/);
  });

  it("adds horizontal gutter on the bubble column", () => {
    const { container } = render(<Bubble role="ai" text="Assistant reply" />);
    const column = container.firstChild as HTMLElement;
    expect(column.className).toMatch(/\bpx-2\b/);
  });
});
