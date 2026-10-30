import { expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { useRef } from "react";
import { MotionHeading } from "./text-reveal";
import { useTextReveal } from "./use-text-reveal";

function Topics({ revision }: { revision: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useTextReveal(ref, revision);
  return (
    <div ref={ref} className="t-stagger">
      <a href="/explore" className="t-stagger-line">
        Explore
      </a>
    </div>
  );
}

it("reveals semantic headings", () => {
  render(
    <MotionHeading>
      <h1 className="t-stagger-line">Welcome</h1>
    </MotionHeading>,
  );
  expect(screen.getByRole("heading").parentElement).toHaveClass("is-shown");
});
it("replays a reveal while preserving the existing focused link", () => {
  const { rerender } = render(<Topics revision="first" />);
  const link = screen.getByRole("link");
  link.focus();
  rerender(<Topics revision="shuffled" />);
  expect(screen.getByRole("link")).toBe(link);
  expect(link).toHaveFocus();
  expect(link).toHaveAttribute("href", "/explore");
  expect(link.parentElement).toHaveClass("is-shown");
});
