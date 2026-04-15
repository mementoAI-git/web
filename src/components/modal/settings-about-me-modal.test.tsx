import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SettingsAboutMeModal from "./settings-about-me-modal";

const close = vi.fn();

vi.mock("@/hooks/use-modal", () => ({
  initialStates: { state: [] },
  useModal: () => ({ close, open: vi.fn(), push: vi.fn(), state: [] }),
}));

describe("SettingsAboutMeModal", () => {
  it("renders paragraphs and closes from the close control", async () => {
    close.mockClear();
    const user = userEvent.setup();
    render(
      <SettingsAboutMeModal
        data={{ paragraphs: ["First paragraph.", "Second paragraph."] }}
      />,
    );

    expect(screen.getByRole("heading", { name: /about me/i })).toBeInTheDocument();
    expect(screen.getByText("First paragraph.")).toBeInTheDocument();
    expect(screen.getByText("Second paragraph.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /close/i }));
    expect(close).toHaveBeenCalledWith("settings-about-me");
  });
});
