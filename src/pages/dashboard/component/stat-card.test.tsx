import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatCard } from "./stat-card";

describe("StatCard", () => {
  it("uses the weak semantic stroke instead of a dark border", () => {
    render(
      <StatCard
        title={12}
        subtitle="Total memories"
        unit="items"
        bgImage="/card-art.svg"
        compact
      />,
    );

    const card = screen.getByText("Total memories").closest("div.relative");
    expect(card).toHaveClass("border-stroke-neutral-weak");
    expect(card).not.toHaveClass("border-black");
  });
});
