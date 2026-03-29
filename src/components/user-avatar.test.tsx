import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { UserAvatar, avatarColorFromSeed } from "./user-avatar";

describe("avatarColorFromSeed", () => {
  it("returns a known variant for any non-empty seed", () => {
    expect(["default", "accent", "success", "warning", "danger"]).toContain(avatarColorFromSeed("x@y.com"));
  });

  it("returns default for empty seed", () => {
    expect(avatarColorFromSeed("")).toBe("default");
  });
});

describe("UserAvatar", () => {
  it("renders gradient fallback with aria-label when there is no image src", () => {
    render(<UserAvatar alt="Sam Smith" name="Sam Smith" email="sam@example.com" />);
    expect(screen.getByLabelText("Sam Smith")).toBeInTheDocument();
    expect(document.querySelector('[data-slot="avatar-fallback"]')).toBeTruthy();
  });

  it("omits root aria-label while image src is set (image provides alt)", () => {
    const { container } = render(
      <UserAvatar alt="Profile" src="https://example.com/a.png" name="A B" />,
    );
    const root = container.querySelector(".user-avatar");
    expect(root).toBeTruthy();
    expect(root).not.toHaveAttribute("aria-label");
    expect(container.querySelector("img")).toBeNull();
  });
});
