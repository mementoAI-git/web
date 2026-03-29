import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import RecentRecipients from "./RecentRecipients";

describe("RecentRecipients", () => {
  it("shows colored fallback avatar in empty state", () => {
    render(<RecentRecipients recipients={[]} />);
    expect(screen.getByText("No recent recipients")).toBeInTheDocument();
    expect(document.querySelector('[data-slot="avatar-fallback"]')).toBeTruthy();
  });
});
