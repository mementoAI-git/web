import { ThemeProvider } from "@/contexts/theme";
import { useReducer, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { OverviewCaptureCard } from "@/pages/dashboard/overview/sections/overview-capture-card";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test";
import { useModal } from "@/hooks/use-modal";
import Voiceinput from "./Voiceinput";

const liveApi = vi.hoisted(() => ({
  greet: vi.fn().mockResolvedValue(undefined),
  connected: false,
  error: null as string | null,
  isRecording: false,
  isRecordingCall: false,
  reconnecting: false,
  thinking: false,
  connect: vi.fn().mockResolvedValue(undefined),
  startRecording: vi.fn().mockResolvedValue(undefined),
  stopRecording: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn(),
  restartSession: vi.fn().mockResolvedValue(undefined),
  setInputMuted: vi.fn(),
}));

const outputLevel = vi.hoisted(() => ({ value: 0 }));
vi.mock("@/hooks/use-ai-playback-level", () => ({ useAiPlaybackLevel: () => () => outputLevel.value }));
vi.mock("voice-glow", () => ({ VoiceBeam: ({ children, active, level }: { children: ReactNode; active: boolean; level: () => number }) => <div data-testid="voice-beam" data-active={active} data-level={level()}>{children}</div> }));

const useLiveAPIOptions = vi.hoisted(() => vi.fn());
const navigateTo = vi.hoisted(() => vi.fn());

vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-router-dom")>()),
  useNavigate: () => navigateTo,
}));

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
    return { ...liveApi, inputNode: null, outputNode: {} as GainNode, error: liveApi.error };
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

const clips = vi.hoisted(() => ({ pick: vi.fn((voiceId: string) => `/${voiceId}.mp3` as string | null) }));
vi.mock("@/lib/voice-preview-clips", () => ({ pickVoicePreviewClip: clips.pick }));

describe("Voiceinput", () => {
  const played: string[] = [];
  const playback = vi.fn<() => Promise<void>>();
  const playedClips = () => played;

  beforeEach(() => {
    playback.mockReset().mockResolvedValue(undefined);
    played.length = 0;
    vi.spyOn(window.HTMLMediaElement.prototype, "play").mockImplementation(function (this: HTMLMediaElement) {
      played.push(new URL(this.src).pathname);
      return playback();
    });
    vi.spyOn(window.HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
    window.history.replaceState({}, "", "/");
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    outputLevel.value = 0;
    liveApi.connected = false;
    liveApi.error = null;
    vi.spyOn(toast, "error").mockClear();
    liveApi.isRecording = false;
    liveApi.isRecordingCall = false;
    liveApi.reconnecting = false;
    liveApi.thinking = false;
    liveApi.connect.mockClear();
    liveApi.greet.mockClear();
    liveApi.startRecording.mockClear();
    liveApi.stopRecording.mockClear();
    liveApi.disconnect.mockClear();
    liveApi.restartSession.mockClear();
    liveApi.setInputMuted.mockClear();
    useLiveAPIOptions.mockClear();
    voiceState.saveVoice.mockClear();
    voiceState.user = { chat_voice: "Kore", chat_voice_provider: "gemini" };
  });

  it.each(["Voice connection closed (1011): Internal error encountered.", null])("restores the capture card and toasts once when an active voice session closes: %s", async (error) => {
    liveApi.connected = true;
    liveApi.isRecording = true;
    let refresh!: () => void;
    function Harness() {
      const [, update] = useReducer((value: number) => value + 1, 0);
      refresh = update;
      const [active, setActive] = useState(true);
      return active ? <Voiceinput inline variant="overview" onCancel={() => setActive(false)} /> : <OverviewCaptureCard userId="interrupted-call" onVoiceConversation={vi.fn()} />;
    }
    renderWithProviders(<Harness />);
    expect(screen.getByRole("status")).toHaveTextContent("Listening");
    liveApi.connected = false;
    liveApi.isRecording = false;
    liveApi.error = error;
    act(() => refresh());
    expect(await screen.findByRole("button", { name: "Add story" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("What’s on your mind today?")).toBeInTheDocument();
    expect(screen.queryByText("Connection interrupted")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledOnce();
    expect(toast.error).toHaveBeenCalledWith("Voice conversation was interrupted. Please try again.");
  });

  it("says Reconnecting while the call moves to a new connection, without ending it", () => {
    liveApi.connected = true;
    liveApi.isRecording = true;
    liveApi.reconnecting = true;
    const onCancel = vi.fn();
    render(<ThemeProvider><Voiceinput inline variant="overview" onCancel={onCancel} /></ThemeProvider>);
    expect(screen.getByRole("status")).toHaveTextContent("Reconnecting…");
    expect(onCancel).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("shows Rec while the conversation is being recorded to Stories", () => {
    liveApi.connected = true;
    liveApi.isRecording = true;
    render(<ThemeProvider><Voiceinput inline variant="overview" onCancel={vi.fn()} /></ThemeProvider>);
    expect(screen.getByRole("status")).not.toHaveTextContent("Rec");
    liveApi.isRecordingCall = true;
    render(<ThemeProvider><Voiceinput inline variant="floating" onCancel={vi.fn()} /></ThemeProvider>);
    expect(screen.getAllByRole("status").at(-1)).toHaveTextContent(/Listening\s*Rec, recording to Stories/);
  });

  it("says Thinking while Memento works on a reply the host is waiting for", () => {
    liveApi.connected = true;
    liveApi.isRecording = true;
    liveApi.thinking = true;
    render(<ThemeProvider><Voiceinput inline variant="overview" onCancel={vi.fn()} /></ThemeProvider>);
    expect(screen.getByRole("status")).toHaveTextContent("Thinking…");
  });

  it("lets voice open the app's modals", () => {
    liveApi.connected = true;
    liveApi.isRecording = true;
    const Probe = () => {
      const { state } = useModal();
      return <p data-testid="open-modal">{state[0]?.name ?? "none"}</p>;
    };
    renderWithProviders(<><Voiceinput inline variant="overview" onCancel={vi.fn()} /><Probe /></>);
    const { toolControls } = useLiveAPIOptions.mock.calls.at(-1)?.[0] as { toolControls: { openModal: (name: string) => void } };
    act(() => toolControls.openModal("create-memory"));
    expect(screen.getByTestId("open-modal")).toHaveTextContent("create-memory");
  });

  it("gives voice tools the screen's controls: open a page, show a mute, hang up", async () => {
    liveApi.connected = true;
    liveApi.isRecording = true;
    const onCancel = vi.fn();
    render(<ThemeProvider><Voiceinput inline variant="overview" onCancel={onCancel} /></ThemeProvider>);
    const { toolControls } = useLiveAPIOptions.mock.calls.at(-1)?.[0] as {
      toolControls: { navigate: (href: string) => void; setMuted: (muted: boolean) => void; endCall: () => void; goBack: () => void; canGoBack: () => boolean };
    };

    act(() => toolControls.navigate("/stories"));
    expect(navigateTo).toHaveBeenCalledWith("/stories");
    act(() => toolControls.goBack());
    expect(navigateTo).toHaveBeenCalledWith(-1);
    expect(typeof toolControls.canGoBack()).toBe("boolean");

    act(() => toolControls.setMuted(true));
    expect(screen.getByRole("button", { name: "Unmute microphone" })).toBeInTheDocument();

    await act(async () => toolControls.endCall());
    await waitFor(() => expect(onCancel).toHaveBeenCalled());
    expect(liveApi.disconnect).toHaveBeenCalled();
  });

  it("keeps a live session open when only message saving fails", () => {
    liveApi.connected = true;
    liveApi.isRecording = true;
    liveApi.error = "Voice is connected, but the latest messages could not be saved.";
    const onCancel = vi.fn();
    render(<ThemeProvider><Voiceinput inline variant="overview" onCancel={onCancel} /></ThemeProvider>);
    expect(onCancel).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(liveApi.error);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mute microphone", exact: true })).toBeEnabled();
  });

  it("starts and greets inline without taking over the page", async () => {
    const { container } = renderWithProviders(<Voiceinput inline autoStart onCancel={vi.fn()} />, { auth: true });
    await waitFor(() => expect(liveApi.greet).toHaveBeenCalledOnce());
    expect(container.querySelector('[aria-label="Voice conversation"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="avatar"]')).toBeInTheDocument();
    expect(container.querySelector('img[src*="dicebear.com"]')).toBeNull();
    expect(screen.queryByTestId("voice-mode-layer")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "End voice conversation" })).toBeInTheDocument();
  });

  it.each(["composer", "overview", "floating"] as const)("confirms before ending a %s inline call", async (variant) => {
    liveApi.isRecording = true;
    liveApi.connected = true;
    const onEnd = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<Voiceinput inline variant={variant} onCancel={onEnd} />, { auth: true });
    await user.click(screen.getByRole("button", { name: "End voice conversation" }));
    expect(screen.getByRole("dialog", { name: "Are you sure you want to end this session?" })).toBeInTheDocument();
    expect(onEnd).not.toHaveBeenCalled();
    expect(liveApi.stopRecording).not.toHaveBeenCalled();
    expect(liveApi.disconnect).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onEnd).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "End voice conversation" }));
    await user.click(screen.getByRole("button", { name: "End Session" }));
    await waitFor(() => expect(onEnd).toHaveBeenCalledOnce());
    expect(liveApi.stopRecording).toHaveBeenCalledOnce();
    expect(liveApi.disconnect).toHaveBeenCalledOnce();
  });

  it.each(["overview", "floating"] as const)("uses the shared voice icons and state fills for the %s mute control", async (variant) => {
    liveApi.isRecording = true;
    liveApi.connected = true;
    const user = userEvent.setup();
    renderWithProviders(<Voiceinput inline variant={variant} onCancel={vi.fn()} />, { auth: true });
    const unmuted = screen.getByRole("button", { name: "Mute microphone", exact: true });
    expect(unmuted).toHaveClass("bg-fill-neutral-weak");
    expect(unmuted).not.toHaveClass("bg-fill-neutral-strong");
    expect(unmuted.querySelector("svg")).toBeNull();
    expect(unmuted.querySelector("img")?.getAttribute("src")).toContain("microphone-01");
    await user.click(unmuted);
    const muted = screen.getByRole("button", { name: "Unmute microphone", exact: true });
    expect(muted).toHaveClass("bg-fill-tab-active");
    expect(muted).not.toHaveClass("bg-fill-neutral-weak");
    expect(muted.querySelector("img")?.getAttribute("src")).toContain("microphone-off-01");
    await user.click(muted);
    expect(screen.getByRole("button", { name: "Mute microphone", exact: true })).toHaveClass("bg-fill-neutral-weak");
  });

  it("keeps the compact floating panel's move handle, settings, and call details", async () => {
    liveApi.isRecording = true;
    liveApi.connected = true;
    const user = userEvent.setup();
    renderWithProviders(<Voiceinput inline variant="floating" onCancel={vi.fn()} />, { auth: true });
    const handle = screen.getByRole("button", { name: "Move voice window" });
    expect(handle).toHaveAttribute("data-voice-drag-handle");
    expect(handle).toHaveClass("inset-0");
    expect(screen.getByLabelText("Call duration")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Listening");
    await user.click(screen.getByRole("button", { name: "Voice settings" }));
    expect(screen.getByRole("dialog", { name: "Voice settings" })).toBeInTheDocument();
  });

  it("shows first-time inline modals and starts with the chosen voice only after saving", async () => {
    voiceState.user = {};
    let finishSaving!: (saved: boolean) => void;
    voiceState.saveVoice.mockReturnValueOnce(new Promise<boolean>(resolve => { finishSaving = resolve; }));
    const user = userEvent.setup();
    renderWithProviders(<Voiceinput inline autoStart variant="overview" onCancel={vi.fn()} />, { auth: true });
    expect(await screen.findByRole("dialog", { name: "Give Voicemode a Spin" })).toBeInTheDocument();
    expect(liveApi.connect).not.toHaveBeenCalled();
    expect(liveApi.startRecording).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Choose a voice" }));
    expect(screen.getByRole("dialog", { name: "Choose a voice" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next voice" }));
    await user.click(screen.getByRole("button", { name: "Select Voice" }));
    expect(voiceState.saveVoice).toHaveBeenCalledWith(voices[1]);
    expect(liveApi.connect).not.toHaveBeenCalled();
    finishSaving(true);
    await waitFor(() => expect(liveApi.connect).toHaveBeenCalledWith({ voiceName: "Aoede" }));
    await waitFor(() => expect(liveApi.greet).toHaveBeenCalledOnce());
    expect(liveApi.startRecording).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("plays each voice as the user moves through the picker, and stops when it closes", async () => {
    voiceState.user = {};
    const user = userEvent.setup();
    renderWithProviders(<Voiceinput inline onCancel={vi.fn()} />, { auth: true });
    await user.click(await screen.findByRole("button", { name: "Choose a voice" }));
    expect(playedClips()).toEqual(["/kore.mp3"]);
    await user.click(screen.getByRole("button", { name: "Next voice" }));
    expect(playedClips()).toEqual(["/kore.mp3", "/aoede.mp3"]);
    await user.click(screen.getByRole("button", { name: "Replay Sue preview" }));
    expect(playedClips()).toEqual(["/kore.mp3", "/aoede.mp3", "/aoede.mp3"]);
    const pause = vi.mocked(window.HTMLMediaElement.prototype.pause);
    pause.mockClear();
    await user.click(screen.getByRole("button", { name: "Select Voice" }));
    await waitFor(() => expect(pause).toHaveBeenCalled());
    expect(playback).toHaveBeenCalledTimes(3);
  });

  it("offers a retry when the browser refuses to play a sample", async () => {
    voiceState.user = {};
    playback.mockRejectedValueOnce(new DOMException("Blocked", "NotAllowedError"));
    const user = userEvent.setup();
    renderWithProviders(<Voiceinput inline onCancel={vi.fn()} />, { auth: true });
    await user.click(await screen.findByRole("button", { name: "Choose a voice" }));
    expect(await screen.findByText("Couldn’t play the sample. Tap the voice to try again.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Replay Denver preview" }));
    await waitFor(() => expect(screen.queryByText(/Couldn’t play the sample/)).not.toBeInTheDocument());
  });

  it("replays the first-time flow for a returning user with ?voiceIntro", async () => {
    window.history.replaceState({}, "", "/overview?voiceIntro=1");
    renderWithProviders(<Voiceinput inline autoStart onCancel={vi.fn()} />, { auth: true });
    expect(await screen.findByRole("dialog", { name: "Give Voicemode a Spin" })).toBeInTheDocument();
    expect(liveApi.connect).not.toHaveBeenCalled();
  });

  it("does not start a call if first-time setup is dismissed", async () => {
    voiceState.user = {};
    const onCancel = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<Voiceinput inline autoStart onCancel={onCancel} />, { auth: true });
    await user.click(await screen.findByRole("button", { name: "Dismiss" }));
    expect(onCancel).toHaveBeenCalledOnce();
    expect(liveApi.connect).not.toHaveBeenCalled();
    expect(liveApi.startRecording).not.toHaveBeenCalled();
  });

  it("keeps the picker open when saving the preferred voice fails", async () => {
    voiceState.user = {};
    voiceState.saveVoice.mockResolvedValueOnce(false);
    const user = userEvent.setup();
    renderWithProviders(<Voiceinput inline autoStart onCancel={vi.fn()} />, { auth: true });
    await user.click(await screen.findByRole("button", { name: "Choose a voice" }));
    await user.click(screen.getByRole("button", { name: "Select Voice" }));
    expect(screen.getByRole("dialog", { name: "Choose a voice" })).toBeInTheDocument();
    expect(liveApi.connect).not.toHaveBeenCalled();
  });

  it("automatically starts once for returning users from Overview", async () => {
    const consumed = vi.fn();
    const { rerender } = render(<ThemeProvider><Voiceinput autoStart onAutoStartConsumed={consumed} onCancel={vi.fn()} /></ThemeProvider>);
    await waitFor(() => expect(liveApi.startRecording).toHaveBeenCalledOnce());
    expect(liveApi.connect).toHaveBeenCalledOnce();
    expect(consumed).toHaveBeenCalledOnce();
    rerender(<ThemeProvider><Voiceinput autoStart onAutoStartConsumed={consumed} onCancel={vi.fn()} /></ThemeProvider>);
    expect(liveApi.connect).toHaveBeenCalledOnce();
  });

  it("shows the overview call card and opens anchored settings without ending the call", async () => {
    liveApi.isRecording = true;
    liveApi.connected = true;
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<ThemeProvider><Voiceinput inline variant="overview" onCancel={onCancel} /></ThemeProvider>);
    expect(screen.getByLabelText("Call duration")).toHaveTextContent("00:00");
    expect(screen.getByRole("status")).toHaveTextContent("Listening");
    expect(screen.queryByText("Let’s talk")).not.toBeInTheDocument();
    const micIconSrc = (name: string) => screen.getByRole("button", { name, exact: true }).querySelector("img")?.getAttribute("src");
    expect(screen.getByRole("button", { name: "Mute microphone", exact: true })).toBeEnabled();
    expect(micIconSrc("Mute microphone")).toContain("microphone-01");
    await user.click(screen.getByRole("button", { name: "Mute microphone", exact: true }));
    expect(screen.getByRole("status")).toHaveTextContent("You’re muted");
    expect(micIconSrc("Unmute microphone")).toContain("microphone-off-01");
    expect(liveApi.setInputMuted).toHaveBeenCalledWith(true);
    await user.click(screen.getByRole("button", { name: "Unmute microphone", exact: true }));
    expect(liveApi.setInputMuted).toHaveBeenLastCalledWith(false);
    expect(screen.getByRole("status")).toHaveTextContent("Listening");
    expect(micIconSrc("Mute microphone")).toContain("microphone-01");
    await user.click(screen.getByRole("button", { name: "Voice settings" }));
    expect(screen.getByRole("dialog", { name: "Voice settings" })).toHaveAttribute("data-side", "bottom");
    expect(document.querySelector('[data-slot="sheet-content"]')).toBeNull();
    expect(screen.getByRole("combobox", { name: "Language" })).toBeInTheDocument();
    expect(document.querySelector('[data-slot="sheet-overlay"]')).toBeNull();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(liveApi.stopRecording).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "End voice conversation" }));
    expect(onCancel).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "End Session" }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("reports actual session transitions and ends the marker on unmount", () => {
    const onSessionChange = vi.fn();
    const { rerender, unmount } = render(<ThemeProvider><Voiceinput inline onCancel={vi.fn()} onSessionChange={onSessionChange} /></ThemeProvider>);
    expect(onSessionChange).not.toHaveBeenCalled();
    liveApi.isRecording = true;
    rerender(<ThemeProvider><Voiceinput inline onCancel={vi.fn()} onSessionChange={onSessionChange} /></ThemeProvider>);
    expect(onSessionChange).toHaveBeenLastCalledWith(true);
    liveApi.isRecording = false;
    rerender(<ThemeProvider><Voiceinput inline onCancel={vi.fn()} onSessionChange={onSessionChange} /></ThemeProvider>);
    expect(onSessionChange).toHaveBeenLastCalledWith(false);
    liveApi.isRecording = true;
    rerender(<ThemeProvider><Voiceinput inline onCancel={vi.fn()} onSessionChange={onSessionChange} /></ThemeProvider>);
    unmount();
    expect(onSessionChange.mock.calls.map(([active]) => active)).toEqual([true, false, true, false]);
  });

  it("drives the beam from AI playback while a session is active", async () => {
    liveApi.isRecording = true;
    outputLevel.value = 0.6;
    const { rerender } = render(<ThemeProvider><Voiceinput onCancel={vi.fn()} /></ThemeProvider>);
    expect(await screen.findByTestId("voice-beam")).toHaveAttribute("data-active", "true");
    expect(screen.getByTestId("voice-beam")).toHaveAttribute("data-level", "0.6");
    outputLevel.value = 0;
    rerender(<ThemeProvider><Voiceinput onCancel={vi.fn()} /></ThemeProvider>);
    expect(screen.getByTestId("voice-beam")).toHaveAttribute("data-level", "0");
  });

  it("shows first-use introduction and continues into voice selection", async () => {
    voiceState.user = {};
    const user = userEvent.setup();
    renderWithProviders(<Voiceinput onCancel={vi.fn()} memoryId="m1" />, { auth: true });

    expect(await screen.findByRole("heading", { name: "Give Voicemode a Spin" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Choose a voice" }));
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
    expect(screen.queryByRole("heading", { name: "Give Voicemode a Spin" })).not.toBeInTheDocument();
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

  it("opens settings as a dialog on phones with Save outside the scrolling fields", async () => {
    const originalWidth = window.innerWidth;
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
    try {
      const user = userEvent.setup();
      renderWithProviders(<Voiceinput onCancel={vi.fn()} memoryId="m1" />, { auth: true });

      await user.click(await screen.findByRole("button", { name: "Voice settings" }));
      const sheet = screen.getByRole("dialog", { name: "Settings" });
      expect(sheet).toHaveAttribute("data-slot", "dialog-content");
      expect(document.querySelector('[data-slot="popover-content"]')).not.toBeInTheDocument();

      const fields = sheet.querySelector("[data-voice-settings-fields]")!;
      expect(fields).toContainElement(screen.getByRole("radio", { name: /sue/i }));
      expect(fields).not.toContainElement(screen.getByRole("button", { name: "Save Changes" }));

      await user.click(screen.getByRole("button", { name: "Dismiss" }));
      expect(screen.queryByRole("dialog", { name: "Settings" })).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Voice settings" }));
      await user.click(screen.getByRole("radio", { name: /sue/i }));
      await user.click(screen.getByRole("button", { name: "Save Changes" }));
      await waitFor(() => expect(voiceState.saveVoice).toHaveBeenCalledWith(voices[1]));
      await waitFor(() => expect(screen.queryByRole("dialog", { name: "Settings" })).not.toBeInTheDocument());
    } finally {
      Object.defineProperty(window, "innerWidth", { configurable: true, value: originalWidth });
    }
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
