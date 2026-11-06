import { useSearchParams } from "react-router-dom";
import {
  CHAT_CONTENT_LAYOUT,
  CHAT_CONTENT_INSET,
  CHAT_COMPOSER_LAYOUT,
  CHAT_COMPOSER_FOOTER,
  CHAT_SCROLL_LAYOUT,
} from "./conversation/chat-layout";
import { ChatStarterCards } from "./conversation/chat-starter-cards";
import { cn } from "@/utility";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { Phone, Image, BookOpen, AudioLines } from "lucide-react";
import {
  getPeople,
  getTalk,
  getSpace,
  addContribution,
  sendTalk,
  PEOPLE_ENDPOINT,
  type Person,
} from "@/api/people";
import { useStore } from "@/hooks/use-store";
import { useVoiceSession } from "@/contexts/voice-session";
import {
  ConversationChatinput,
  type IOnSendPayload,
} from "@/components/Chatinput";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { OurSpace } from "../people/our-space";
import { ConnectionSettingsDialog } from "../people/connection-settings";
import { ChatSwitcher, ConnectionSummary } from "./chat-switcher";

export function ConnectionChat({ personId }: { personId: string }) {
  const { user } = useStore();
  const { data, error, isLoading, mutate } = useSWR(
    user?._id ? [PEOPLE_ENDPOINT, user._id] : null,
    getPeople,
    { refreshInterval: 15000 },
  );
  const person = data?.connections.find(
    (person) => person.user_id === personId,
  );
  if (error)
    return (
      <div role="alert" className="m-auto p-8">
        <p>Couldn’t load this connection.</p>
        <Button onClick={() => void mutate()}>Try again</Button>
      </div>
    );
  if (isLoading || !data)
    return (
      <p role="status" className="m-auto p-8">
        Loading your connection…
      </p>
    );
  if (!person)
    return (
      <div className="m-auto space-y-4 p-8 text-center">
        <p>This connection is no longer available.</p>
        <ChatSwitcher />
      </div>
    );
  return (
    <ConnectionConversation key={`${user?._id}:${personId}`} person={person} />
  );
}

function ConnectionConversation({ person }: { person: Person }) {
  const { user } = useStore();
  const voice = useVoiceSession();
  const [params, setParams] = useSearchParams();
  const detailsOpen = params.get("details") === "1";
  const closeDetails = () =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete("details");
        return next;
      },
      { replace: true },
    );
  const acknowledgementKey = `connection-introduction:v1:${user?._id}:${person.user_id}`;
  const [understood, setUnderstood] = useState(() => {
    try {
      return localStorage.getItem(acknowledgementKey) === "understood";
    } catch {
      return false;
    }
  });
  const composer = useRef<HTMLDivElement>(null);
  const needsIntroduction = person.memento_state !== "active" && !understood;
  const acknowledge = () => {
    try {
      localStorage.setItem(acknowledgementKey, "understood");
    } catch {
      /* Continue for this visit if storage is unavailable. */
    }
    setUnderstood(true);
  };
  const { data, error, isLoading, mutate } = useSWR(
    ["people-talk", user?._id, person.user_id],
    () => getTalk(person.user_id),
    { refreshInterval: 15000, shouldRetryOnError: false },
  );
  const {
    data: spaceData,
    error: spaceError,
    mutate: mutateSpace,
  } = useSWR(
    ["people-space", user?._id, person.user_id, 1, "All"],
    () => getSpace(person.user_id, 1, "All"),
    { refreshInterval: 15000, shouldRetryOnError: false },
  );
  const restoreIdentityFocus = (event: Event) => {
    event.preventDefault();
    document
      .querySelector<HTMLButtonElement>(
        ".navigation-header [data-connection-details]",
      )
      ?.focus();
  };
  const [overlay, setOverlay] = useState<"edit" | null>(null);
  const [source, setSource] = useState<{ id: string; title: string } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const [retry, setRetry] = useState<IOnSendPayload | null>(null);
  const request = useRef<{
    signature: string;
    id: string;
    sharedId?: string;
  } | null>(null);
  const sending = useRef(false);
  const mounted = useRef(true);
  const end = useRef<HTMLDivElement>(null);
  const active = Boolean(data && !error);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    end.current?.scrollIntoView?.({ block: "nearest" });
  }, [data?.turns.length, spaceData?.total, busy]);
  const scroller = useRef<HTMLDivElement>(null);
  const timeline = useRef<HTMLDivElement>(null);
  // Late-loading images grow the timeline, so stay on the newest message unless the reader has scrolled up.
  useEffect(() => {
    const root = scroller.current;
    const content = timeline.current;
    if (!root || !content || typeof ResizeObserver === "undefined") return;
    let pinned = true;
    let lastTop = root.scrollTop;
    const onScroll = () => {
      const top = root.scrollTop;
      if (root.scrollHeight - top - root.clientHeight < 80) pinned = true;
      else if (top < lastTop) pinned = false;
      lastTop = top;
    };
    const observer = new ResizeObserver(() => {
      if (pinned) root.scrollTop = root.scrollHeight;
    });
    root.addEventListener("scroll", onScroll, { passive: true });
    observer.observe(content);
    return () => {
      root.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);
  useEffect(() => {
    if (!active && voice?.connectionPersonId === person.user_id) voice.end();
  }, [active, person.user_id, voice]);
  useEffect(() => {
    if (voice?.connectionPersonId === person.user_id) {
      void mutate();
      void mutateSpace();
    }
  }, [
    voice?.timeline.length,
    voice?.connectionPersonId,
    person.user_id,
    mutate,
    mutateSpace,
  ]);
  const send = async (payload: IOnSendPayload) => {
    if (!data || error || sending.current) return;
    const attachments = payload.attachments?.map((file) => file._id) || [];
    const signature = JSON.stringify([payload.text, attachments, source?.id]);
    const id =
      request.current?.signature === signature
        ? request.current.id
        : crypto.randomUUID();
    if (request.current?.signature !== signature)
      request.current = { signature, id };
    sending.current = true;
    setBusy(true);
    setFailure("");
    setRetry(payload);
    try {
      if (!request.current.sharedId) {
        const shared = await addContribution(person.user_id, {
          title: payload.text.trim().slice(0, 80) || "Shared attachment",
          body: payload.text || "Shared an attachment",
          kind: payload.attachments?.some((file) =>
            file.type?.startsWith("video/"),
          )
            ? "video"
            : payload.attachments?.some((file) =>
                  file.type?.startsWith("image/"),
                )
              ? "photo"
              : payload.attachments?.some((file) =>
                    file.type?.startsWith("audio/"),
                  )
                ? "voice"
                : "note",
          attachments,
        });
        request.current.sharedId = shared.source_id;
        await mutateSpace();
      }
      if (active) {
        await sendTalk(person.user_id, {
          text: payload.text,
          attachments,
          request_id: id,
          source_id: source?.id || request.current.sharedId,
          shared_input_id: request.current.sharedId,
          shared_space: true,
        });
      }
      if (!mounted.current) return;
      await mutate();
      setRetry(null);
      setSource(null);
      request.current = null;
    } catch {
      if (mounted.current)
        setFailure(
          request.current?.sharedId
            ? "Your information was shared, but the Memento couldn’t reply. Retry the reply."
            : "Couldn’t share your information. Retry when you’re ready.",
        );
    } finally {
      sending.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  const startVoice = () => {
    closeDetails();
    voice?.start({
      connectionPersonId: person.user_id,
      history: data?.turns
        .filter((turn) => turn.available)
        .map(({ role, text }) => ({ role, text })),
    });
  };
  const firstName = person.name.trim().split(/\s+/)[0];
  const identity = (
    <>
      <UserAvatar
        alt=""
        userId={person.user_id}
        name={person.name}
        src={person.avatar_url}
        size="lg"
      />
      <span className="min-w-0 text-left">
        <span className="block max-w-48 truncate text-sm leading-5 font-medium">
          {person.name}
        </span>
        <span className="block text-xs leading-4 text-text-neutral-weaker">
          <ConnectionSummary person={person} />
        </span>
      </span>
    </>
  );
  const firstConversation = Boolean(
    active &&
    data &&
    !data.turns.length &&
    spaceData?.total === 0 &&
    !isLoading &&
    !error,
  );
  return (
    <section
      aria-label={`${person.name}’s Memento`}
      className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background text-text-neutral-strong"
    >
      <div ref={scroller} className={CHAT_SCROLL_LAYOUT}>
        <div
          ref={timeline}
          className={cn(
            CHAT_CONTENT_LAYOUT,
            CHAT_CONTENT_INSET,
            firstConversation && "justify-center",
          )}
        >
          <div>
            {(Boolean(spaceData?.total) || Boolean(data?.turns.length)) && (
              <OurSpace
                embedded
                chatTurns={data?.turns}
                person={person}
                onTalk={
                  active ? (id, title) => setSource({ id, title }) : undefined
                }
              />
            )}
            {spaceError && (
              <div role="alert" className="mx-auto max-w-3xl py-4 text-center">
                <Button variant="outline" onClick={() => void mutateSpace()}>
                  Retry loading shared memories
                </Button>
              </div>
            )}
          </div>
          {isLoading || (!spaceData && !spaceError) ? (
            <p
              role="status"
              className="py-12 text-center text-sm text-text-neutral-weak"
            >
              Loading your conversation…
            </p>
          ) : error ? (
            <div role="alert" className="py-12 text-center">
              <p>Couldn’t load your conversation.</p>
              <Button variant="outline" onClick={() => void mutate()}>
                Try again
              </Button>
            </div>
          ) : firstConversation ? (
            <div className="mx-auto flex w-full max-w-[458px] flex-col items-center gap-4 text-center">
              <div className="flex flex-col items-center gap-3">
                <h1 className="font-geist text-base font-semibold leading-6">
                  Start a conversation with {firstName}’s Memento
                </h1>
                <p className="max-w-[350px] font-geist text-sm leading-5 text-text-neutral-weak">
                  {person.memento_state === "active"
                    ? `Ask me about the stories, memories, and experiences ${firstName} has chosen to share with you.`
                    : `Share a memory with ${firstName}’s Memento, or let it ask you a question to get started.`}
                </p>
              </div>
              <ChatStarterCards
                disabled={busy}
                prompts={
                  person.memento_state !== "active"
                    ? [
                        {
                          label: "Help me share a memory",
                          prompt:
                            "Help me share a memory. Ask me one question to get started.",
                        },
                        {
                          label: "Ask me about our time together",
                          prompt:
                            "Ask me a question about a moment we spent together.",
                        },
                      ]
                    : [
                        {
                          label: `What was it like growing up as ${firstName}?`,
                          prompt: `What was it like growing up as ${firstName}?`,
                        },
                        {
                          label: `What are some of ${firstName}’s core values?`,
                          prompt: `What are some of ${firstName}’s core values?`,
                        },
                      ]
                }
                onPrompt={(prompt) => void send({ text: prompt })}
              />
            </div>
          ) : null}
          {busy && (
            <p
              role="status"
              className="mx-auto max-w-3xl text-sm text-text-neutral-weak"
            >
              {person.name}’s Memento is reflecting…
            </p>
          )}
          <div ref={end} />
        </div>
        {data && !error && (
          <div className={cn(CHAT_COMPOSER_FOOTER, "pt-1")}>
            <div ref={composer} className={cn(CHAT_COMPOSER_LAYOUT, "px-3")}>
              {source && (
                <p className="mb-2 text-xs text-text-neutral-weak">
                  About: {source.title}{" "}
                  <button className="underline" onClick={() => setSource(null)}>
                    Clear
                  </button>
                </p>
              )}
              {failure && (
                <div
                  role="alert"
                  className="mb-3 text-sm text-text-error-strong"
                >
                  {failure}
                  <Button
                    variant="ghost"
                    disabled={busy}
                    onClick={() => retry && void send(retry)}
                  >
                    Retry message
                  </Button>
                </div>
              )}
              <ConversationChatinput
                loading={busy}
                connectionPersonId={person.user_id}
                placeholder={`Ask ${person.name}’s Memento anything…`}
                inputClassName="!text-sm sm:!text-base"
                onSend={(payload) => void send(payload)}
                draftStorageKey={`connection-draft:${user?._id}:${person.user_id}`}
                history={data?.turns
                  .filter((turn) => turn.available)
                  .map(({ role, text }) => ({ role, text }))}
              />
            </div>
          </div>
        )}
      </div>
      {needsIntroduction && (
        <Dialog open>
          <DialogContent
            className="people-dialog"
            showCloseButton={false}
            onEscapeKeyDown={(event) => event.preventDefault()}
            onInteractOutside={(event) => event.preventDefault()}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              composer.current?.querySelector("textarea")?.focus();
            }}
          >
            <div aria-hidden="true" className="relative mx-auto mt-2 h-28 w-48">
              <div className="absolute left-1 top-4 flex h-20 w-16 -rotate-12 flex-col items-center justify-center gap-2 rounded-lg border border-stroke-neutral-weak bg-bg-raised shadow-sm">
                <BookOpen
                  className="size-6 text-text-neutral-weaker"
                  strokeWidth={1.5}
                />
                <span className="h-1 w-8 rounded-full bg-fill-neutral-weak" />
              </div>
              <div className="absolute right-1 top-4 flex h-20 w-16 rotate-12 flex-col items-center justify-center gap-2 rounded-lg border border-stroke-neutral-weak bg-bg-raised shadow-sm">
                <AudioLines
                  className="size-6 text-text-neutral-weaker"
                  strokeWidth={1.5}
                />
                <span className="h-1 w-8 rounded-full bg-fill-neutral-weak" />
              </div>
              <div className="absolute left-1/2 top-1 flex h-24 w-20 -translate-x-1/2 -rotate-3 flex-col gap-2 rounded-lg border border-stroke-neutral-weak bg-bg-raised p-2 shadow-sm">
                <div className="flex flex-1 items-center justify-center rounded bg-fill-neutral-weak">
                  <Image
                    className="size-8 text-text-brand-strong"
                    strokeWidth={1.5}
                  />
                </div>
                <span className="h-1 w-9 rounded-full bg-fill-neutral-weak" />
              </div>
            </div>
            <DialogHeader>
              <DialogTitle>
                {person.name}’s Memento is still getting started
              </DialogTitle>
              <DialogDescription>
                You can chat, call, and share memories here. As {person.name}{" "}
                shares more, their Memento will have more context to draw from.
              </DialogDescription>
            </DialogHeader>
            <Button onClick={acknowledge}>I understand</Button>
          </DialogContent>
        </Dialog>
      )}
      {detailsOpen && (
        <Dialog open onOpenChange={(open) => !open && closeDetails()}>
          <DialogContent
            onCloseAutoFocus={restoreIdentityFocus}
            className="people-dialog max-h-[85dvh] overflow-y-auto"
          >
            <DialogHeader>
              <div className="mb-3 flex items-center gap-3">{identity}</div>
              <DialogTitle>{person.name}</DialogTitle>
              <DialogDescription>
                {person.memento_state === "active"
                  ? "Memento active"
                  : person.memento_state === "ready"
                    ? "Shared-memory chat · profile ready to activate"
                    : "Shared-memory chat · profile context private"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2">
              {active && (
                <Button variant="outline" onClick={startVoice}>
                  <Phone className="size-4" aria-hidden />
                  Start voice conversation
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={() => {
                  closeDetails();
                  setOverlay("edit");
                }}
              >
                Edit how I’ve saved this person
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  closeDetails();
                  setOverlay("edit");
                }}
              >
                Remove or block connection
              </Button>
            </div>
            <p className="text-xs leading-6 text-text-neutral-weak">
              Messages and attachments you add here are shared with{" "}
              {person.name}. AI replies and older private conversations stay
              private to you. Their Memento uses only approved context and
              shared memories.
            </p>
          </DialogContent>
        </Dialog>
      )}
      {overlay === "edit" && (
        <ConnectionSettingsDialog
          person={person}
          onClose={() => setOverlay(null)}
        />
      )}
    </section>
  );
}
