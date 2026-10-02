import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test";
import Voiceinput from "./Voiceinput";

const liveApi = vi.hoisted(() => ({
  connected: false,
  isRecording: false,
  connect: vi.fn().mockResolvedValue(undefined),
  startRecording: vi.fn().mockResolvedValue(undefined),
  stopRecording: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn(),
  restartSession: vi.fn().mockResolvedValue(undefined),
  setInputMuted: vi.fn(),
}));

const useLiveAPIOptions = vi.hoisted(() => vi.fn());

const voiceState = vi.hoisted(() => ({
  user: { chat_voice: "Kore", chat_voice_provider: "gemini" } as {
    chat_voice?: string;
    chat_voice_provider?: "gemini" | "elevenlabs";
  },
  saveVoice: vi.fn().mockResolvedValue(true),
}));

const voices = [
  {
    id: "kore",
    title: "Denver",
    subtitle: "warm",
    gender: "male",
    voiceName: "Kore",
    provider: "gemini" as const,
    artwork: "/denver.jpg",
    metadata: "Male · Warm",
  },
  {
    id: "aoede",
    title: "Sue",
    subtitle: "bright",
    gender: "female",
    voiceName: "Aoede",
    provider: "gemini" as const,
    artwork: "/sue.jpg",
    metadata: "Female · Bright",
  },
];

vi.mock("@/hooks/use-live-api", () => ({
  useLiveAPI: (options: unknown) => {
    useLiveAPIOptions(options);
    return { ...liveApi, inputNode: null, outputNode: null, error: null };
  },
}));

vi.mock("@/hooks/use-store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/use-store")>();
  return { ...actual, useStore: () => ({ user: voiceState.user }) };
});

vi.mock("./voice-mode-voices", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./voice-mode-voices")>();
  return {
    ...actual,
    useVoiceModeVoices: () => ({
      voices,
      selectedVoice: voices.find((voice) => voice.voiceName === voiceState.user.chat_voice) || voices[0],
      saveVoice: voiceState.saveVoice,
      isSaving: false,
    }),
  };
});

describe("Voiceinput", () => {
  beforeEach(() => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    liveApi.connected = false;
    liveApi.isRecording = false;
    liveApi.connect.mockClear();
    liveApi.startRecording.mockClear();
    liveApi.stopRecording.mockClear();
    liveApi.disconnect.mockClear();
    liveApi.restartSession.mockClear();
    liveApi.setInputMuted.mockClear();
    useLiveAPIOptions.mockClear();
    voiceState.saveVoice.mockClear();
    voiceState.user = { chat_voice: "Kore", chat_voice_provider: "gemini" };
  });

  it("shows first-use introduction and continues into voice selection", async () => {
    voiceState.user = {};
    const user = userEvent.setup();
    renderWithProviders(<Voiceinput onCancel={vi.fn()} memoryId="m1" />, { auth: true });

    expect(await screen.findByRole("heading", { name: "Try Voicemode" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByRole("heading", { name: "Choose a voice" })).toBeInTheDocument();
    expect(screen.getByText("Denver")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next voice" }));
    expect(screen.getByText("Sue")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Select Voice" }));

    await waitFor(() => expect(voiceState.saveVoice).toHaveBeenCalledWith(voices[1]));
    expect(screen.getByRole("button", { name: "Start conversation" })).toBeInTheDocument();
  });

  it("lets returning users start from the focused pre-call state", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Voiceinput onCancel={vi.fn()} memoryId="m1" />, { auth: true });

    expect(await screen.findByText("Ready when you are")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Try Voicemode" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "End voice conversation" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Start conversation" }));

    expect(liveApi.connect).toHaveBeenCalledOnce();
    expect(liveApi.startRecording).toHaveBeenCalledOnce();
  });

  it("lets users exit voice mode before starting a session", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    renderWithProviders(<Voiceinput onCancel={onCancel} memoryId="m1" />, { auth: true });

    const exitButton = await screen.findByRole("button", { name: "Exit" });
    expect(exitButton).toHaveAttribute("data-variant", "secondary");

    await user.click(exitButton);
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("mutes the actual microphone input and reflects the muted state", async () => {
    liveApi.connected = true;
    liveApi.isRecording = true;
    const user = userEvent.setup();
    renderWithProviders(<Voiceinput onCancel={vi.fn()} memoryId="m1" />, { auth: true });

    expect(screen.queryByRole("button", { name: "Exit" })).not.toBeInTheDocument();

    await user.click(await screen.findByRole("button", { name: "Mute microphone" }));

    expect(liveApi.setInputMuted).toHaveBeenCalledWith(true);
    expect(screen.getByRole("button", { name: "Unmute microphone" })).toHaveAttribute("aria-pressed", "true");
    const controls = screen.getByTestId("voice-session-controls");
    expect(controls).toHaveClass("gap-4");
    expect(screen.getByRole("button", { name: "Unmute microphone" })).toHaveClass("size-14", "rounded-full");
    expect(screen.getByRole("button", { name: "End voice conversation" })).toHaveClass("size-14", "rounded-full");
  });

  it("requires confirmation before ending and then returns to chat", async () => {
    liveApi.isRecording = true;
    const user = userEvent.setup();
    const onCancel = vi.fn();
    renderWithProviders(<Voiceinput onCancel={onCancel} memoryId="m1" />, { auth: true });

    await user.click(await screen.findByRole("button", { name: "End voice conversation" }));
    expect(onCancel).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: /are you sure you want to end this session/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "End Session" }));
    await waitFor(() => expect(onCancel).toHaveBeenCalledOnce());
    expect(liveApi.stopRecording).toHaveBeenCalledOnce();
  });

  it("opens anchored settings without an overlay and saves voice and language", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Voiceinput onCancel={vi.fn()} memoryId="m1" />, { auth: true });

    await user.click(await screen.findByRole("button", { name: "Voice settings" }));
    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
    expect(document.querySelector('[data-slot="popover-content"]')).toHaveClass(
      "shadow-2xl",
      "shadow-overlay-backdrop-dark",
    );
    expect(document.querySelector('[data-slot="dialog-overlay"]')).not.toBeInTheDocument();

    const languageSelect = screen.getByRole("combobox", { name: "Language" });
    fireEvent.keyDown(languageSelect, { key: "ArrowDown" });
    expect(await screen.findAllByRole("option")).toHaveLength(7);
    await user.click(screen.getByRole("option", { name: "Spanish" }));
    await user.click(screen.getByRole("radio", { name: /sue/i }));
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => expect(voiceState.saveVoice).toHaveBeenCalledWith(voices[1]));
    await waitFor(() =>
      expect(useLiveAPIOptions).toHaveBeenLastCalledWith(
        expect.objectContaining({ languageCode: "es-ES" }),
      ),
    );
  });

  it("uses quiet regular typography for voice settings secondary text", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Voiceinput onCancel={vi.fn()} memoryId="m1" />, {
      auth: true,
    });

    await user.click(await screen.findByRole("button", { name: "Voice settings" }));

    for (const text of [
      "Customize your voice conversation.",
      "Used for speech and transcripts.",
      "Male · Warm",
      "Female · Bright",
    ]) {
      expect(screen.getByText(text)).toHaveClass(
        "text-text-neutral-weak",
        "font-normal",
      );
    }
  });

  it("restarts an active voice session with the newly saved voice and language", async () => {
    liveApi.connected = true;
    liveApi.isRecording = true;
    const user = userEvent.setup();
    renderWithProviders(<Voiceinput onCancel={vi.fn()} memoryId="m1" />, { auth: true });

    await user.click(await screen.findByRole("button", { name: "Voice settings" }));
    expect(screen.getByText("Changes apply immediately to your live session.")).toBeInTheDocument();
    const languageSelect = screen.getByRole("combobox", { name: "Language" });
    fireEvent.keyDown(languageSelect, { key: "ArrowDown" });
    await user.click(await screen.findByRole("option", { name: "French" }));
    await user.click(screen.getByRole("radio", { name: /sue/i }));
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() =>
      expect(liveApi.restartSession).toHaveBeenCalledWith({
        languageCode: "fr-FR",
        voiceName: "Aoede",
      }),
    );
  });
});
