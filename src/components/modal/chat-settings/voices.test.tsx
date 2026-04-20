import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Voices from "./voices";
import { renderWithProviders } from "@/test";

vi.mock("swr", async (importOriginal) => {
  const actual = await importOriginal<typeof import("swr")>();
  return { ...actual, mutate: vi.fn() };
});

const previewGeminiChatVoice = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/gemini-voice-preview", () => ({
  previewGeminiChatVoice: (...args: unknown[]) => previewGeminiChatVoice(...args),
}));

const profileTrigger = vi.fn().mockResolvedValue({ data: {} });
const tokenTrigger = vi.fn().mockResolvedValue({ data: { token: "tok" } });

vi.mock("@/hooks/use-fetcher", () => ({
  default: (url: string) => {
    if (url === "/ai/ephemeral-token") {
      return { isMutating: false, trigger: tokenTrigger };
    }
    return { isMutating: false, trigger: profileTrigger };
  },
}));

const toastError = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

describe("Voices", () => {
  it("saves the voice as default immediately then runs Gemini preview", async () => {
    previewGeminiChatVoice.mockClear();
    profileTrigger.mockClear();
    tokenTrigger.mockClear();
    const user = userEvent.setup();

    renderWithProviders(<Voices />, {
      auth: true,
      route: "/overview",
    });

    const clara = screen.getByRole("button", { name: /clara/i });
    await user.click(clara);

    await waitFor(() => {
      expect(profileTrigger).toHaveBeenCalledWith({ chat_voice: "Leda" });
    });
    await waitFor(() => {
      expect(previewGeminiChatVoice).toHaveBeenCalledWith(
        expect.objectContaining({
          voiceName: "Leda",
          fetchToken: expect.any(Function),
          signal: expect.any(AbortSignal),
        }),
      );
    });
    const previewArgs = previewGeminiChatVoice.mock.calls[0]?.[0] as {
      fetchToken: () => Promise<unknown>;
    };
    await expect(previewArgs.fetchToken()).resolves.toBeDefined();
    expect(tokenTrigger).toHaveBeenCalled();
  });

  it("runs preview when re-selecting the current voice without profile put", async () => {
    previewGeminiChatVoice.mockClear();
    profileTrigger.mockClear();
    tokenTrigger.mockClear();
    const user = userEvent.setup();

    renderWithProviders(<Voices />, {
      auth: true,
      route: "/overview",
    });

    const vince = screen.getByRole("button", { name: /vince/i });
    await user.click(vince);

    await waitFor(() => {
      expect(previewGeminiChatVoice).toHaveBeenCalledWith(
        expect.objectContaining({ voiceName: "Algenib" }),
      );
    });
    expect(profileTrigger).not.toHaveBeenCalled();
  });

  it("keeps the saved default when preview fails", async () => {
    toastError.mockClear();
    previewGeminiChatVoice.mockRejectedValueOnce(new Error("network"));
    profileTrigger.mockClear();
    const user = userEvent.setup();

    renderWithProviders(<Voices />, {
      auth: true,
      route: "/overview",
    });

    const clara = screen.getByRole("button", { name: /clara/i });
    await user.click(clara);

    await waitFor(() => {
      expect(profileTrigger).toHaveBeenCalledWith({ chat_voice: "Leda" });
    });
    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith("Could not play voice sample");
    });
  });
});
