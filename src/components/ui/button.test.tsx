import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("applies the brand surface gradient to the primary variant", () => {
    render(<Button>Primary action</Button>);

    expect(screen.getByRole("button", { name: "Primary action" })).toHaveClass(
      "bg-fill-brand-strong",
      "[background-image:var(--gradient-brand-button-surface)]",
    );
  });

  it("does not apply the brand surface gradient to other variants", () => {
    render(<Button variant="secondary">Secondary action</Button>);

    expect(
      screen.getByRole("button", { name: "Secondary action" }),
    ).not.toHaveClass(
      "[background-image:var(--gradient-brand-button-surface)]",
    );
  });
});
