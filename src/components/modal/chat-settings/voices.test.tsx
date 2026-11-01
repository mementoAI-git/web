import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Voices from "./voices";
import { MOBILE_VOICE_CATALOG } from "@/features/voice/mobile-voice-catalog";
import { renderWithProviders } from "@/test";
import { initialStates, StoreValueProvider } from "@/hooks/use-store";
import { mockUser } from "@/test/fixtures";

vi.mock("swr", async (importOriginal) => {
  const actual = await importOriginal<typeof import("swr")>();
  const useSWRMock = ((key: unknown) => {
    const keyText = typeof key === "string" ? key : "";
    if (keyText.includes("/ai/voices?provider=gemini")) {
      return {
        data: {
          data: {
            voices: [
              { id: "kore", title: "Kore", subtitle: "warm", gender: "female", voiceName: "Kore", platform: "Gemini", client: "Web", imageUrl: "/kore.png" },
              { id: "leda", title: "Leda", subtitle: "clear", gender: "female", voiceName: "Leda" },
              { title: "Denver", voiceName: "Fenrir" },
              { title: "Wrong Sue", voiceName: "Aoede" },
              { title: "Josef", voiceName: "Enceladus" },
              { title: "Leo", voiceName: "Puck" },
            ],
          },
        },
      };
    }
    if (keyText.includes("/ai/voices?provider=elevenlabs")) {
      return { data: { data: { voices: [] } } };
    }
    return { data: undefined };
  }) as unknown as typeof actual.default;
  return { ...actual, default: useSWRMock, mutate: vi.fn() };
});

const previewGeminiChatVoice = vi.fn().mockResolvedValue(undefined);
const previewElevenLabsVoice = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/gemini-voice-preview", () => ({
  previewGeminiChatVoice: (...args: unknown[]) => previewGeminiChatVoice(...args),
}));
vi.mock("@/lib/elevenlabs-voice-preview", () => ({
  previewElevenLabsVoice: (...args: unknown[]) => previewElevenLabsVoice(...args),
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
  it("uses the exact mobile portraits instead of API artwork", () => {
    const requested: HTMLImageElement[] = [];
    vi.stubGlobal("Image", class {
      constructor() {
        const img = document.createElement("img");
        requested.push(img);
        return img;
      }
    });
    try {
      renderWithProviders(<Voices />, {auth: true});
      expect(requested.map((img) => img.getAttribute("src"))).toContain(MOBILE_VOICE_CATALOG[3].artwork);
      expect(requested.some((img) => img.src.includes("dicebear.com"))).toBe(false);
    } finally { vi.unstubAllGlobals(); }
  });

  it("shows only the name and one gender-and-type metadata line", () => {
    renderWithProviders(<Voices />, {
      auth: true,
      route: "/overview",
    });

    expect(screen.getByText("Hannah")).toBeInTheDocument();
    expect(screen.getByText("Female v4")).toBeInTheDocument();
    expect(screen.queryByText(/Gemini · Web/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /hannah/i }).querySelector('[data-slot="avatar"]')).toBeInTheDocument();
  });

  it("shows the same six names and labels as mobile in the same order", () => {
    renderWithProviders(<Voices />, {auth: true});
    const choices = screen.getAllByRole("button").filter((button) => button.hasAttribute("aria-pressed"));
    expect(choices).toHaveLength(6);
    MOBILE_VOICE_CATALOG.forEach((voice, index) => {
      expect(choices[index]).toHaveTextContent(voice.title);
      expect(choices[index]).toHaveTextContent(voice.subtitle);
    });
    expect(screen.queryByText("Memento Agent")).not.toBeInTheDocument();
  });

  it("saves the voice as default immediately then runs Gemini preview", async () => {
    previewGeminiChatVoice.mockClear();
    previewElevenLabsVoice.mockClear();
    profileTrigger.mockClear();
    tokenTrigger.mockClear();
    const user = userEvent.setup();

    renderWithProviders(<Voices />, {
      auth: true,
      route: "/overview",
    });

    const leda = screen.getByRole("button", { name: /maya/i });
    await user.click(leda);

    await waitFor(() => {
      expect(profileTrigger).toHaveBeenCalledWith({ chat_voice: "Leda", chat_voice_provider: "gemini" });
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
    const descriptor = {token: "tok", live: {model: "gemini-3.8-live", voice: {name: "Leda"}}};
    tokenTrigger.mockResolvedValueOnce({data: descriptor});
    await expect(previewArgs.fetchToken()).resolves.toEqual(descriptor);
    expect(tokenTrigger).toHaveBeenCalled();
    expect(previewElevenLabsVoice).not.toHaveBeenCalled();
  });

  it("persists Denver when the previously saved voice is outside the mobile catalog", async () => {
    profileTrigger.mockClear();
    renderWithProviders(<StoreValueProvider value={{...initialStates, user: {...mockUser, chat_voice: "Orus", chat_voice_provider: "gemini"}, setUser: vi.fn()}}><Voices /></StoreValueProvider>, {auth: true});
    await userEvent.setup().click(screen.getByRole("button", {name: /Denver/}));
    expect(profileTrigger).toHaveBeenCalledWith({chat_voice: "Fenrir", chat_voice_provider: "gemini"});
  });

  it("runs preview when re-selecting the current voice without profile put", async () => {
    previewGeminiChatVoice.mockClear();
    previewElevenLabsVoice.mockClear();
    profileTrigger.mockClear();
    tokenTrigger.mockClear();
    const user = userEvent.setup();

    renderWithProviders(<StoreValueProvider value={{...initialStates, user: {...mockUser, chat_voice: "sue", chat_voice_provider: "gemini"}}}><Voices /></StoreValueProvider>, {
      auth: true,
      route: "/overview",
    });

    const kore = screen.getByRole("button", { name: /sue/i });
    await user.click(kore);

    await waitFor(() => {
      expect(previewGeminiChatVoice).toHaveBeenCalledWith(
        expect.objectContaining({ voiceName: "Aoede" }),
      );
    });
    expect(profileTrigger).not.toHaveBeenCalled();
    expect(previewElevenLabsVoice).not.toHaveBeenCalled();
  });

  it("prevents overlapping voice preference saves", async () => {
    profileTrigger.mockClear();
    let release!: () => void;
    profileTrigger.mockImplementationOnce(() => new Promise<void>((resolve) => { release = resolve; }));
    const user = userEvent.setup();
    renderWithProviders(<Voices />, { auth: true });
    const leda = screen.getByRole("button", { name: /maya/i });
    await user.click(leda);
    await user.click(leda);
    expect(profileTrigger).toHaveBeenCalledTimes(1);
    release();
    await waitFor(() => expect(leda).toHaveAttribute("aria-busy", "false"));
  });

  it("aborts an active voice sample when the preferences close", async () => {
    previewGeminiChatVoice.mockClear();
    const user = userEvent.setup();
    const { unmount } = renderWithProviders(<Voices />, { auth: true });
    await user.click(screen.getByRole("button", { name: /maya/i }));
    await waitFor(() => expect(previewGeminiChatVoice).toHaveBeenCalled());
    // A resolved sample has finished; keep this sample pending to exercise cleanup.
    previewGeminiChatVoice.mockImplementationOnce(() => new Promise(() => {}));
    await user.click(screen.getByRole("button", { name: /maya/i }));
    await waitFor(() => expect(previewGeminiChatVoice).toHaveBeenCalledTimes(2));
    const signal = previewGeminiChatVoice.mock.calls[1][0].signal as AbortSignal;
    expect(signal.aborted).toBe(false);
    unmount();
    expect(signal.aborted).toBe(true);
  });

  it("keeps the saved default when preview fails", async () => {
    toastError.mockClear();
    previewGeminiChatVoice.mockRejectedValueOnce(new Error("network"));
    previewElevenLabsVoice.mockClear();
    profileTrigger.mockClear();
    const user = userEvent.setup();

    renderWithProviders(<Voices />, {
      auth: true,
      route: "/overview",
    });

    const leda = screen.getByRole("button", { name: /maya/i });
    await user.click(leda);

    await waitFor(() => {
      expect(profileTrigger).toHaveBeenCalledWith({ chat_voice: "Leda", chat_voice_provider: "gemini" });
    });
    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith("Could not play voice sample");
    });
  });
});
