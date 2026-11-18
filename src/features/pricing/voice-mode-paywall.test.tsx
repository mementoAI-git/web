import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test";

import { VoiceModePaywall } from "./voice-mode-paywall";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("VoiceModePaywall", () => {
  it("shows upgrade prompt again after maybe later when reopened", async () => {
    const user = userEvent.setup();

    const { rerender } = renderWithProviders(
      <VoiceModePaywall conversationId="conv-1" />,
      { route: "/chat/conv-1/voice", auth: true },
    );

    expect(
      screen.getByRole("heading", { name: /used this month’s free voice minutes/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /let me think about it/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/chat/conv-1", { replace: true });

    rerender(<VoiceModePaywall conversationId="conv-1" />);
    expect(
      screen.getByRole("heading", { name: /used this month’s free voice minutes/i }),
    ).toBeInTheDocument();
  });
});
