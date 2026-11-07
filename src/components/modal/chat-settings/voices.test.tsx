import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

const playClip = vi.hoisted(() => vi.fn());
vi.mock("@/components/Chatinput/use-voice-preview-clip", () => ({
  useVoicePreviewClip: () => ({ play: playClip, stop: vi.fn(), failed: false }),
}));

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

async function pickVoice(user: ReturnType<typeof userEvent.setup>, name: RegExp) {
  if (!screen.queryByRole("menu")) await user.click(screen.getByRole("button", { name: /select voice/i }));
  await user.click(await screen.findByRole("menuitemradio", { name }));
}

describe("Voices", () => {
  // These voices have no bundled clip unless a test says so, which exercises the live fallback.
  beforeEach(() => {
    playClip.mockReset();
    playClip.mockReturnValue(false);
  });

  it("plays the bundled clip straight away, without waiting for the save or going live", async () => {
    playClip.mockReturnValue(true);
    previewGeminiChatVoice.mockClear();
    tokenTrigger.mockClear();
    profileTrigger.mockClear();
    let release!: () => void;
    profileTrigger.mockImplementationOnce(() => new Promise<void>((resolve) => { release = resolve; }));
    renderWithProviders(<Voices />, { auth: true });
    await pickVoice(userEvent.setup(), /maya/i);
    expect(playClip).toHaveBeenCalledWith("maya");
    expect(profileTrigger).toHaveBeenCalledWith({ chat_voice: "Leda", chat_voice_provider: "gemini" });
    expect(screen.getByRole("menuitemradio", { name: /maya/i })).toHaveAttribute("aria-checked", "true");
    expect(previewGeminiChatVoice).not.toHaveBeenCalled();
    expect(tokenTrigger).not.toHaveBeenCalled();
    release();
  });

  it("stays open after a pick, so each voice can be tried", async () => {
    playClip.mockReturnValue(true);
    const user = userEvent.setup();
    renderWithProviders(<Voices />, { auth: true });
    await pickVoice(user, /maya/i);
    expect(screen.getByRole("menu")).toBeInTheDocument();
    await pickVoice(user, /josef/i);
    expect(playClip).toHaveBeenLastCalledWith("josef");
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("uses the exact mobile portraits instead of API artwork", async () => {
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
      await userEvent.setup().click(screen.getByRole("button", { name: /select voice/i }));
      await screen.findAllByRole("menuitemradio");
      expect(requested.map((img) => img.getAttribute("src"))).toContain(MOBILE_VOICE_CATALOG[3].artwork);
      expect(requested.some((img) => img.src.includes("dicebear.com"))).toBe(false);
    } finally { vi.unstubAllGlobals(); }
  });

  it("shows only the name and one gender-and-type metadata line", async () => {
    renderWithProviders(<Voices />, {
      auth: true,
      route: "/overview",
    });
    await userEvent.setup().click(screen.getByRole("button", { name: /select voice/i }));

    expect(await screen.findByText("Hannah")).toBeInTheDocument();
    expect(screen.getByText("Female v4")).toBeInTheDocument();
    expect(screen.queryByText(/Gemini · Web/i)).not.toBeInTheDocument();
    expect(screen.getByRole("menuitemradio", { name: /hannah/i }).querySelector('[data-slot="avatar"]')).toBeInTheDocument();
  });

  it("lists the same six names and labels as mobile in the same order, with one selected", async () => {
    renderWithProviders(<Voices />, {auth: true});
    await userEvent.setup().click(screen.getByRole("button", { name: /select voice/i }));
    const choices = await screen.findAllByRole("menuitemradio");
    expect(choices).toHaveLength(6);
    MOBILE_VOICE_CATALOG.forEach((voice, index) => {
      expect(choices[index]).toHaveTextContent(voice.title);
      expect(choices[index]).toHaveTextContent(voice.subtitle);
    });
    expect(choices.filter((choice) => choice.getAttribute("aria-checked") === "true")).toHaveLength(1);
    expect(screen.queryByText("Memento Agent")).not.toBeInTheDocument();
  });

  it("shows the current voice on the closed menu", () => {
    renderWithProviders(<StoreValueProvider value={{...initialStates, user: {...mockUser, chat_voice: "Leda", chat_voice_provider: "gemini"}, setUser: vi.fn()}}><Voices /></StoreValueProvider>);
    expect(screen.getByRole("button", { name: /select voice: maya/i })).toBeInTheDocument();
    expect(screen.queryByRole("menuitemradio")).not.toBeInTheDocument();
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

    await pickVoice(user, /maya/i);

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
    await pickVoice(userEvent.setup(), /Denver/);
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

    await pickVoice(user, /sue/i);

    await waitFor(() => {
      expect(previewGeminiChatVoice).toHaveBeenCalledWith(
        expect.objectContaining({ voiceName: "Aoede" }),
      );
    });
    expect(profileTrigger).not.toHaveBeenCalled();
    expect(previewElevenLabsVoice).not.toHaveBeenCalled();
  });

  it("saves one voice at a time, ending on the latest pick", async () => {
    playClip.mockReturnValue(true);
    profileTrigger.mockClear();
    let release!: () => void;
    profileTrigger.mockImplementationOnce(() => new Promise<void>((resolve) => { release = resolve; }));
    const user = userEvent.setup();
    renderWithProviders(<Voices />, { auth: true });
    await pickVoice(user, /maya/i);
    await pickVoice(user, /hannah/i);
    await pickVoice(user, /josef/i);
    expect(profileTrigger).toHaveBeenCalledTimes(1);
    release();
    await waitFor(() => expect(profileTrigger).toHaveBeenCalledTimes(2));
    expect(profileTrigger).toHaveBeenLastCalledWith({ chat_voice: "Enceladus", chat_voice_provider: "gemini" });
  });

  it("aborts an active voice sample when the preferences close", async () => {
    previewGeminiChatVoice.mockClear();
    const user = userEvent.setup();
    const { unmount } = renderWithProviders(<Voices />, { auth: true });
    await pickVoice(user, /maya/i);
    await waitFor(() => expect(previewGeminiChatVoice).toHaveBeenCalled());
    // A resolved sample has finished; keep this sample pending to exercise cleanup.
    previewGeminiChatVoice.mockImplementationOnce(() => new Promise(() => {}));
    await pickVoice(user, /maya/i);
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

    await pickVoice(user, /maya/i);

    await waitFor(() => {
      expect(profileTrigger).toHaveBeenCalledWith({ chat_voice: "Leda", chat_voice_provider: "gemini" });
    });
    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith("Could not play voice sample");
    });
  });
});
