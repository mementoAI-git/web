import { useEffect, useState } from "react";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import { OverviewVoiceSlot, VoiceSessionProvider, useVoiceSession } from "./voice-session";
import type { VoiceRuntime, VoiceMessage } from "@/features/voice/types";

const lifecycle = vi.hoisted(() => ({ mounts: vi.fn(), ends: vi.fn(), send: vi.fn().mockResolvedValue(undefined), messageObservers: [] as ((messages: VoiceMessage[]) => void)[] }));
vi.mock("@/hooks/use-store", () => ({ useStore: () => ({ user: { _id: "user-1" } }) }));
vi.mock("@/components/Chatinput/inline-voice-session", () => ({
  InlineVoiceSession: ({ variant, onRuntime, onSessionChange, onEnd, onMessages }: { onMessages: (messages: VoiceMessage[]) => void; variant: string; onRuntime: (runtime: VoiceRuntime | null) => void; onSessionChange: (active: boolean) => void; onEnd: () => void }) => {
    lifecycle.messageObservers.push(onMessages);
    const [muted, setMuted] = useState(false);
    useEffect(() => {
      lifecycle.mounts();
      onRuntime({ ready: true, send: lifecycle.send });
      onSessionChange(true);
      return () => { lifecycle.ends(); onRuntime(null); onSessionChange(false); };
    }, [onRuntime, onSessionChange]);
    return <section aria-label="Persistent call" data-variant={variant}><button onClick={() => setMuted(!muted)}>{muted ? "Unmute" : "Mute"}</button><button onClick={onEnd}>End</button></section>;
  },
}));
function Pages() {
  const voice = useVoiceSession()!;
  const navigate = useNavigate();
  const { pathname } = useLocation();
  return <><button onClick={() => voice.start({ memoryId: "m1" })}>Start</button><button onClick={() => navigate("/overview")}>Overview</button><button onClick={() => navigate("/stories")}>Stories</button><button onClick={() => navigate("/chat/m1")}>Chat</button><button onClick={() => void voice.send({ text: "Look at this", attachments: [] })}>Send text</button>{pathname === "/overview" && voice.active && <OverviewVoiceSlot />}<output>{voice.timeline.map(entry => entry.kind).join(",")}</output></>;
}
beforeEach(() => vi.clearAllMocks());
it("keeps the same session and mute state while docking on Overview and floating elsewhere", async () => {
  const user = userEvent.setup();
  render(<MemoryRouter initialEntries={["/chat/m1"]}><VoiceSessionProvider><Pages /></VoiceSessionProvider></MemoryRouter>);
  await user.click(screen.getByText("Start"));
  await user.click(screen.getByText("Mute"));
  const call = screen.getByRole("region", { name: "Persistent call" });
  expect(within(screen.getByTestId("floating-voice-host")).getByText("Unmute")).toBeInTheDocument();
  await user.click(screen.getByText("Overview"));
  expect(within(screen.getByTestId("overview-voice-slot")).getByText("Unmute")).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "Persistent call" })).toBe(call);
  expect(call).toHaveAttribute("data-variant", "overview");
  await user.click(screen.getByText("Stories"));
  expect(call).toHaveAttribute("data-variant", "floating");
  expect(screen.getByText("Unmute")).toBeInTheDocument();
  await user.click(screen.getByText("Start"));
  expect(lifecycle.mounts).toHaveBeenCalledOnce();
  expect(lifecycle.ends).not.toHaveBeenCalled();
  await user.click(screen.getByText("Send text"));
  expect(lifecycle.send).toHaveBeenCalledWith({ text: "Look at this", attachments: [] });
  await user.click(screen.getByText("End"));
  await waitFor(() => expect(lifecycle.ends).toHaveBeenCalledOnce());
  expect(screen.getByText("started,ended")).toBeInTheDocument();
});

it("ignores transcript saves arriving after their call has ended", async () => {
  const user = userEvent.setup();
  render(<MemoryRouter initialEntries={["/chat/m1"]}><VoiceSessionProvider><Pages /></VoiceSessionProvider></MemoryRouter>);
  await user.click(screen.getByText("Start"));
  const oldObserver = lifecycle.messageObservers.at(-1)!;
  await user.click(screen.getByText("End"));
  await user.click(screen.getByText("Start"));
  act(() => oldObserver([{ _id: "late", text: "Old call", created_at: new Date().toISOString() }]));
  expect(screen.getByText("started,ended,started")).toBeInTheDocument();
});

it("reconciles local messages with saved messages without duplicating the timeline", async () => {
  const user = userEvent.setup();
  render(<MemoryRouter initialEntries={["/chat/m1"]}><VoiceSessionProvider><Pages /></VoiceSessionProvider></MemoryRouter>);
  await user.click(screen.getByText("Start"));
  const observer = lifecycle.messageObservers.at(-1)!;
  act(() => observer([{ _id: "local", text: "Hello", created_at: new Date().toISOString() }]));
  act(() => observer([{ _id: "saved", clientId: "local", text: "Hello", created_at: new Date().toISOString() }]));
  expect(screen.getByText("started,message")).toBeInTheDocument();
});
