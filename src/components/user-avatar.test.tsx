import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { UserAvatar, avatarColorFromSeed } from "./user-avatar";

describe("avatarColorFromSeed", () => {
  const palette = ["bg-muted", "bg-blue-100", "bg-green-100", "bg-amber-100", "bg-red-100"] as const;

  it("returns a known Tailwind background class for any non-empty seed", () => {
    expect(palette).toContain(avatarColorFromSeed("x@y.com"));
  });

  it("returns bg-muted for empty seed", () => {
    expect(avatarColorFromSeed("")).toBe("bg-muted");
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
