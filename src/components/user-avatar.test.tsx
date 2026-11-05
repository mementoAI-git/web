import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { UserAvatar } from "./user-avatar";

let images: HTMLImageElement[];
beforeEach(() => {
  images = [];
  vi.stubGlobal(
    "Image",
    class {
      constructor() {
        const image = document.createElement("img");
        images.push(image);
        return image;
      }
    },
  );
});
afterEach(() => vi.unstubAllGlobals());

function finishImage(event: "load" | "error" = "load") {
  act(() => images.at(-1)!.dispatchEvent(new Event(event)));
}

describe("UserAvatar", () => {
  it("uses Loops with a normalized email seed", () => {
    render(
      <UserAvatar alt="Sam Smith" name="Sam Smith" email=" SAM@example.com " />,
    );
    finishImage();
    expect(screen.getByRole("img", { name: "Sam Smith" })).toHaveAttribute(
      "src",
      "https://api.dicebear.com/10.x/loops/svg?seed=sam%40example.com",
    );
    expect(screen.getByRole("img", { name: "Sam Smith" })).not.toHaveClass(
      "scale-150",
    );
    expect(screen.getByLabelText("Sam Smith")).toHaveClass(
      "overflow-hidden",
      "p-0",
    );
  });

  it.each([
    { userId: "User-123", name: "Sam Smith", expected: "user-123" },
    { name: " Sam Smith ", expected: "sam%20smith" },
  ])(
    "uses an ID before a name when email is unavailable: $expected",
    ({ expected, ...props }) => {
      render(<UserAvatar alt="Profile" {...props} />);
      finishImage();
      expect(screen.getByRole("img")).toHaveAttribute(
        "src",
        `https://api.dicebear.com/10.x/loops/svg?seed=${expected}`,
      );
    },
  );

  it("uses the same account seed even when email and display name differ", () => {
    const { rerender } = render(
      <UserAvatar
        alt="Profile"
        userId="user-123"
        email="old@example.com"
        name="Sam"
      />,
    );
    finishImage();
    const url = screen.getByRole("img").getAttribute("src");
    rerender(
      <UserAvatar
        alt="Profile"
        userId="user-123"
        email="new@example.com"
        name="Samuel"
      />,
    );
    expect(screen.getByRole("img")).toHaveAttribute("src", url);
    expect(url).toBe(
      "https://api.dicebear.com/10.x/loops/svg?seed=user-123",
    );
  });

  it.each([
    "https://api.dicebear.com/10.x/critters/png?seed=old",
    "https://api.dicebear.com/10.x/initial-face/svg?seed=old",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=old",
  ])("replaces a previously generated avatar URL: %s", (src) => {
    render(<UserAvatar alt="Sam" name="Sam" userId="sam-id" src={src} />);
    finishImage();
    expect(screen.getByRole("img")).toHaveAttribute(
      "src", "https://api.dicebear.com/10.x/loops/svg?seed=sam-id",
    );
  });

  it("keeps uploaded photos instead of generating an avatar", () => {
    render(
      <UserAvatar
        alt="Profile"
        src="https://example.com/a.png"
        email="sam@example.com"
      />,
    );
    finishImage();
    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      "https://example.com/a.png",
    );
    expect(screen.getByRole("img")).not.toHaveClass("scale-150");
  });

  it("uses the canonical generated avatar if an uploaded photo fails, then initials if both fail", () => {
    render(
      <UserAvatar
        alt="Sam Smith"
        name="Sam Smith"
        src="https://example.com/missing.png"
        email="sam@example.com"
      />,
    );
    finishImage("error");
    finishImage();
    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      "https://api.dicebear.com/10.x/loops/svg?seed=sam%40example.com",
    );
    finishImage("error");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("SS")).toBeInTheDocument();
    expect(images).toHaveLength(2);
  });

  it("shows initials when an image fails, as on mobile", () => {
    render(
      <UserAvatar alt="Sam Smith" name="Sam Smith" email="sam@example.com" />,
    );
    finishImage("error");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("SS")).toBeInTheDocument();
    expect(screen.getByLabelText("Sam Smith")).toBeInTheDocument();
  });

  it("keeps a neutral fallback when there is no user information", () => {
    render(<UserAvatar alt="No recipients" />);
    expect(images).toHaveLength(0);
    expect(screen.getByLabelText("No recipients")).toHaveTextContent(/^$/);
  });
});
