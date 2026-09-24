import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChatLinkPreview } from "./chat-link-preview";

describe("ChatLinkPreview", () => {
  it("renders available metadata as a compact preview", () => {
    render(<ChatLinkPreview link={{ key: "https://mymemento.io/", url: "https://mymemento.io/", title: "Mymemento.io", domain: "mymemento.io" }} />);
    expect(screen.getByText("Mymemento.io")).toBeInTheDocument();
    expect(screen.getByText("mymemento.io")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open mymemento/i })).toHaveAttribute("target", "_blank");
  });

  it("falls back to an accessible plain URL", () => {
    render(<ChatLinkPreview link={{ key: "https://example.com/", url: "https://example.com/" }} />);
    expect(screen.getByRole("link", { name: "https://example.com/" })).toHaveAttribute("rel", "noopener noreferrer");
  });
});
