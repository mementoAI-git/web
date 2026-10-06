import { useFloatingVoicePosition } from "@/hooks/use-floating-voice-position";
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { InlineVoiceSession } from "@/components/Chatinput/inline-voice-session";
import type { VoiceMessage, VoiceRuntime, VoiceTextInput, VoiceTimelineEntry } from "@/features/voice/types";
import { useStore } from "@/hooks/use-store";

type StartVoice = { memoryId?: string | null; history?: { role: "user" | "ai"; text: string }[] };
interface VoiceSessionContextValue {
  active: boolean;
  ready: boolean;
  memoryId: string | null;
  start: (options: StartVoice) => void;
  end: () => void;
  send: (input: VoiceTextInput) => Promise<void>;
  dock: (element: HTMLDivElement | null) => void;
  timeline: VoiceTimelineEntry[];
}
const VoiceSessionContext = createContext<VoiceSessionContextValue | null>(null);

export function VoiceSessionProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useStore();
  const [request, setRequest] = useState<(StartVoice & { sessionId: string }) | null>(null);
  const requestRef = useRef<(StartVoice & { sessionId: string }) | null>(null);
  const [ready, setReady] = useState(false);
  const [timeline, setTimeline] = useState<VoiceTimelineEntry[]>([]);
  const [dockTarget, dock] = useState<HTMLDivElement | null>(null);
  const [host] = useState(() => document.createElement("div"));
  const fallback = useRef<HTMLDivElement>(null);
  const runtime = useRef<VoiceRuntime | null>(null);
  const live = useRef(false);
  const overview = location.pathname === "/overview" || location.pathname === "/";
  const docked = overview && Boolean(dockTarget);
  const floatingPosition = useFloatingVoicePosition(host, fallback, Boolean(request) && !docked);
  const append = useCallback((entry: { kind: "started" | "ended" } | { kind: "message"; message: VoiceMessage }) => {
    setTimeline(previous => [...previous, { ...entry, id: crypto.randomUUID(), sessionId: requestRef.current?.sessionId, memoryId: requestRef.current?.memoryId ?? null, created_at: new Date().toISOString() }]);
  }, []);
  const onSessionChange = useCallback((active: boolean) => {
    if (live.current === active) return;
    live.current = active;
    append({ kind: active ? "started" : "ended" });
  }, [append]);
  const end = useCallback(() => {
    onSessionChange(false);
    runtime.current = null;
    setReady(false);
    setRequest(null);
    requestRef.current = null;
  }, [onSessionChange]);
  const start = useCallback((options: StartVoice) => {
    // One live conversation, regardless of how many entry buttons are clicked.
    if (requestRef.current) return;
    requestRef.current = { ...options, sessionId: crypto.randomUUID() };
    setRequest(requestRef.current);
  }, []);
  const registerRuntime = useCallback((value: VoiceRuntime | null) => {
    runtime.current = value;
    setReady(value?.ready ?? false);
  }, []);
  const sessionId = request?.sessionId;
  const onMessages = useCallback((messages: VoiceMessage[]) => {
    // Ignore pending saves from a call that ended or belonged to another user.
    if (!sessionId || requestRef.current?.sessionId !== sessionId) return;
    const memory = (messages[0] as VoiceMessage & { memory?: string })?.memory;
    if (memory && requestRef.current && !requestRef.current.memoryId) {
      requestRef.current = { ...requestRef.current, memoryId: String(memory) };
      setRequest(requestRef.current);
      setTimeline(previous => previous.map(entry => entry.memoryId || entry.sessionId !== sessionId ? entry : { ...entry, memoryId: String(memory) }));
    }
    setTimeline(previous => {
      const next = [...previous];
      for (const message of messages) {
        const index = next.findIndex(entry => entry.kind === "message" && entry.sessionId === sessionId && (entry.message._id === message._id || entry.message._id === message.clientId));
        if (index >= 0) next[index] = { ...next[index], kind: "message", message };
        else next.push({ kind: "message", message, id: crypto.randomUUID(), sessionId, memoryId: requestRef.current?.memoryId ?? null, created_at: message.created_at });
      }
      return next;
    });
  }, [sessionId]);
  const send = useCallback(async (input: VoiceTextInput) => {
    if (!runtime.current?.ready) throw new Error("Voice is still connecting. Please try again when it is ready.");
    await runtime.current.send(input);
    const memoryId = requestRef.current?.memoryId;
    if (memoryId && location.pathname.startsWith("/chat") && location.pathname !== `/chat/${memoryId}`) {
      navigate(`/chat/${memoryId}`);
    }
  }, [location.pathname, navigate]);
  // Move one stable portal host; changing React portal targets would remount audio.
  useLayoutEffect(() => {
    const parent = docked ? dockTarget : fallback.current;
    parent?.appendChild(host);
  }, [docked, dockTarget, host]);
  useEffect(() => () => host.remove(), [host]);
  const owner = useRef(user?._id);
  useEffect(() => {
    if (owner.current && owner.current !== user?._id) {
      end();
      setTimeline([]);
    }
    owner.current = user?._id;
  }, [user?._id, end]);

  return <VoiceSessionContext.Provider value={{ active: Boolean(request), ready, memoryId: request?.memoryId ?? null, start, end, send, dock, timeline }}>
    {children}
    <div ref={fallback} style={floatingPosition} data-testid="floating-voice-host" className={docked || !request ? "hidden" : "fixed right-4 top-[84px] z-40 w-[min(325px,calc(100vw-2rem))] sm:right-8"} />
    {request && createPortal(<InlineVoiceSession
      persistent
      variant={docked ? "overview" : "floating"}
      memoryId={request.memoryId}
      history={request.history}
      onEnd={end}
      onSessionChange={onSessionChange}
      onRuntime={registerRuntime}
      onMessages={onMessages}
    />, host)}
  </VoiceSessionContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useVoiceSession = () => useContext(VoiceSessionContext);

export function OverviewVoiceSlot() {
  const voice = useVoiceSession();
  return <div ref={voice?.dock} className="w-full" data-testid="overview-voice-slot" />;
}
