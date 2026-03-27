import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import UserItem from "./user-item";

describe("UserItem", () => {
  it("uses v3 weak text for name and sm size for email", () => {
    render(<UserItem name="Jane Doe" email="jane@example.com" />);
    expect(screen.getByText("Jane Doe")).toHaveClass("text-v3-text-weak");
    expect(screen.getByText("jane@example.com")).toHaveClass("text-sm");
  });
});
