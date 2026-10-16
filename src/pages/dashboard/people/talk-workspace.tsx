import { useEffect, useRef, useState } from "react";
import useSWR, { mutate as mutateCache } from "swr";
import { Mic, Phone, PhoneOff, Send, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  getTalk,
  sendTalk,
  isPeopleKey,
  type Person,
  type TalkTurn,
} from "@/api/people";
import { useStore } from "@/hooks/use-store";
import { SharedItemDialog } from "./shared-item-dialog";
import { usePeopleSpeech } from "./use-people-speech";
export function TalkWorkspace({
  person,
  source,
  onSourceUsed,
}: {
  person: Person;
  source?: { id: string; title: string } | null;
  onSourceUsed?: () => void;
}) {
  const { user } = useStore();
  const { data, error, isLoading, mutate } = useSWR(
    ["people-talk", user?._id, person.user_id],
    () => getTalk(person.user_id),
    { shouldRetryOnError: false, refreshInterval: 15000 },
  );
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const sending = useRef(false);
  const [failure, setFailure] = useState("");
  const [detail, setDetail] = useState<string | null>(null);
  const [voiceDraft, setVoiceDraft] = useState(false);
  const mounted = useRef(true);
  const retry = useRef<{ text: string; id: string } | null>(null);
  const available = Boolean(data?.available && !error);
  const listEnd = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (source) setText(`Tell me about “${source.title}”.`);
  }, [source]);
  useEffect(() => {
    listEnd.current?.scrollIntoView?.({ block: "nearest", behavior: "auto" });
  }, [data?.turns.length, busy]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const send = async (
    message: string,
    isVoice = false,
  ): Promise<string | null> => {
    if (!available || sending.current || !message.trim()) return null;
    const value = message.trim().slice(0, 4000);
    const requestId =
      retry.current?.text === value ? retry.current.id : crypto.randomUUID();
    retry.current = { text: value, id: requestId };
    sending.current = true;
    setBusy(true);
    setFailure("");
    try {
      const answer = await sendTalk(person.user_id, {
        text: value,
        request_id: requestId,
        is_voice: isVoice,
        ...(source ? { source_id: source.id } : {}),
      });
      if (!mounted.current) return null;
      const question: TalkTurn = {
        id: `local:${requestId}`,
        role: "user",
        text: value,
        created_at: new Date().toISOString(),
        is_voice: isVoice,
        available: true,
        citations: [],
      };
      await mutate(
        (previous) => ({
          available: true,
          turns: [...(previous?.turns || []), question, answer],
        }),
        false,
      );
      setText("");
      setVoiceDraft(false);
      retry.current = null;
      onSourceUsed?.();
      return answer.text;
    } catch {
      if (mounted.current) {
        setFailure(
          "Couldn’t get a response. Your message is still here so you can retry.",
        );
        void mutate();
        void mutateCache(isPeopleKey);
      }
      return null;
    } finally {
      sending.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  const speech = usePeopleSpeech({
    enabled: available,
    onDictation: (value) => {
      setText((previous) =>
        `${previous}${previous ? " " : ""}${value}`.slice(0, 4000),
      );
      setVoiceDraft(true);
    },
    onVoiceMessage: (message) => send(message, true),
  });
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stroke-neutral-weak px-5 py-3 sm:px-9">
        <p className="flex items-center gap-2 text-xs leading-5 text-text-neutral-weak">
          <LockKeyhole
            className="size-3.5 text-icon-neutral-weak"
            aria-hidden
          />
          Private to you. {person.name} can’t read this conversation.
        </p>
        {available && (
          <Button
            size="form"
            variant="ghost"
            className="people-control"
            disabled={!speech.callSupported || (busy && !speech.calling)}
            onClick={speech.calling ? speech.stop : speech.startCall}
          >
            {speech.calling ? <PhoneOff aria-hidden /> : <Phone aria-hidden />}
            {speech.calling ? "End voice call" : "Start voice call"}
          </Button>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-7 sm:px-9">
        {isLoading ? (
          <p role="status" className="text-sm text-text-neutral-weak">
            Loading your private conversation…
          </p>
        ) : error ? (
          <div role="alert">
            <p className="text-text-neutral-weak">
              Couldn’t load Talk. This connection may no longer be available.
            </p>
            <Button
              size="form"
              variant="outline"
              className="mt-3"
              onClick={() => void mutate()}
            >
              Try again
            </Button>
          </div>
        ) : !data?.available ? (
          <p className="text-text-neutral-weak">
            This Memento is no longer active.
          </p>
        ) : !data.turns.length ? (
          <div className="mx-auto max-w-lg py-10 text-center">
            <h3 className="font-garamond text-3xl text-text-neutral-strong">
              A conversation with {person.name}’s Memento
            </h3>
            <p className="mt-3 text-sm leading-6 text-text-neutral-weak">
              Ask about a memory you’ve shared.
            </p>
          </div>
        ) : (
          <ol
            aria-label="Private conversation"
            className="mx-auto max-w-3xl space-y-6"
          >
            {data.turns.map((turn) => (
              <li
                key={turn.id}
                className={
                  turn.role === "user"
                    ? "ml-auto max-w-[90%] rounded-2xl bg-fill-neutral-weak px-5 py-4"
                    : "max-w-[95%]"
                }
              >
                <p className="mb-2 text-xs font-medium text-text-neutral-weak">
                  {turn.role === "user" ? "You" : `${person.name}’s Memento`}
                </p>
                <p className="whitespace-pre-wrap text-sm leading-7 text-text-neutral-strong">
                  {turn.text}
                </p>
                {turn.citations.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {turn.citations.map((citation) => (
                      <Button
                        key={citation.source_id}
                        variant="outline"
                        size="sm"
                        className="people-control max-w-full"
                        onClick={() => setDetail(citation.source_id)}
                      >
                        <span className="truncate">
                          From Our Space: {citation.title}
                        </span>
                      </Button>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}
        {busy && (
          <p
            role="status"
            className="mx-auto mt-6 max-w-3xl text-sm text-text-neutral-weak"
          >
            {person.name}’s Memento is reflecting…
          </p>
        )}
        <div ref={listEnd} />
      </div>
      {available && (
        <form
          className="space-y-3 border-t border-stroke-neutral-weak bg-bg-neutral px-5 py-4 sm:px-9"
          onSubmit={(event) => {
            event.preventDefault();
            void send(text, voiceDraft);
          }}
        >
          {source && (
            <p className="text-xs text-text-neutral-weak">
              Using shared memory: {source.title}
            </p>
          )}
          {failure && (
            <p role="alert" className="text-sm text-text-error-strong">
              {failure}
            </p>
          )}
          {speech.error && (
            <p role="alert" className="text-sm text-text-error-strong">
              {speech.error}
            </p>
          )}
          {speech.status !== "idle" && (
            <p role="status" className="text-sm text-text-neutral-weak">
              {speech.status === "listening"
                ? "Listening…"
                : speech.status === "speaking"
                  ? "Reading the response…"
                  : "Getting a response…"}
            </p>
          )}
          <div className="flex items-end gap-2">
            <Textarea
              aria-label={`Message ${person.name}’s Memento`}
              placeholder="Ask about a memory…"
              value={text}
              maxLength={4000}
              disabled={busy || speech.calling}
              onChange={(event) => setText(event.target.value)}
              className="max-h-40 min-h-20 resize-none"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="people-control shrink-0"
              aria-label={
                speech.status === "listening" && !speech.calling
                  ? "Stop dictation"
                  : "Dictate message"
              }
              disabled={!speech.supported || busy || speech.calling}
              onClick={
                speech.status === "listening" ? speech.stop : speech.dictate
              }
            >
              <Mic aria-hidden />
            </Button>
            <Button
              type="submit"
              size="icon"
              className="people-control shrink-0"
              aria-label="Send message"
              disabled={busy || speech.calling || !text.trim()}
            >
              <Send aria-hidden />
            </Button>
          </div>
          <p className="text-xs leading-5 text-text-neutral-weak">
            {speech.supported
              ? "Voice uses your browser’s speech service."
              : "Voice isn’t available in this browser; you can use text."}{" "}
            Memento is an AI and may make mistakes.
          </p>
        </form>
      )}
      {detail && (
        <SharedItemDialog
          person={person}
          sourceId={detail}
          onClose={() => setDetail(null)}
          onRemoved={() => void mutate()}
        />
      )}
    </div>
  );
}
