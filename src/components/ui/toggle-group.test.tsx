import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ToggleGroup, ToggleGroupItem } from "./toggle-group";

describe("ToggleGroupItem", () => {
  it("does not apply spacing-0 square corners for default variant (pill className preserved)", () => {
    render(
      <ToggleGroup type="single" defaultValue="a" spacing={0}>
        <ToggleGroupItem value="a" className="rounded-[100px]">
          A
        </ToggleGroupItem>
      </ToggleGroup>,
    );

    expect(screen.getByRole("radio")).toHaveClass("rounded-[100px]");
    expect(screen.getByRole("radio")).toHaveClass("text-icon-neutral-weak");
  });
});
