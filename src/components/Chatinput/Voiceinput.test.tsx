import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test";
import Voiceinput from "./Voiceinput";

vi.mock("@/hooks/use-live-api", () => ({
  useLiveAPI: () => ({
    connected: false,
    connect: vi.fn().mockResolvedValue(undefined),
    startRecording: vi.fn().mockResolvedValue(undefined),
    stopRecording: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn(),
    inputNode: null,
    outputNode: null,
    isRecording: false,
    error: null,
  }),
}));

vi.mock("./AudioVisual3D", () => ({
  Visual3D: () => <div data-testid="voice-visual" />,
}));

vi.mock("../modal/chat-settings", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="chat-settings-wrap">{children}</div>,
}));

describe("Voiceinput", () => {
  it("renders Start call, End call, and settings by default", () => {
    const onCancel = vi.fn();
    renderWithProviders(<Voiceinput onCancel={onCancel} memoryId="m1" />, {
      auth: true,
      route: "/chat/m1/voice",
    });

    expect(screen.getByRole("button", { name: /end call/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^start call$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /chat settings/i })).toBeInTheDocument();
    const layer = screen.getByTestId("voice-mode-layer");
    expect(layer).toBeInTheDocument();
    expect(layer.className).toMatch(/\bbg-sand-1\b/);
  });

  it("invokes onCancel when End call is pressed", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    renderWithProviders(<Voiceinput onCancel={onCancel} memoryId="m1" />, {
      auth: true,
    });

    await user.click(screen.getByRole("button", { name: /end call/i }));
    await vi.waitFor(() => {
      expect(onCancel).toHaveBeenCalled();
    });
  });
});
