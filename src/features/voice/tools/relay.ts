/**
 * Answers Gemini Live function calls from the browser. The model waits for a
 * response, so every call gets one, even on failure, unless Gemini cancels it
 * or the voice call ended. Mirrors mobile's voice-tool-relay.ts.
 */

export const SEARCH_MEMORIES_TOOL = "search_memories";

/** Longest Memento waits on a memory search before carrying on without it. */
export const VOICE_MEMORY_SEARCH_TIMEOUT_MS = 6_000;

export const MEMORY_SEARCH_UNAVAILABLE =
  "Memory search is unavailable right now. Continue the conversation without it.";

export type VoiceToolCall = { id?: string; name?: string; args?: Record<string, unknown> };

/** Which call a handler is answering, and whether it still matters. */
export type VoiceToolInvocation = { callId?: string; isLive: () => boolean };

export type VoiceToolHandler = (
  args: Record<string, unknown>,
  invocation?: VoiceToolInvocation,
) => Promise<string> | string;

export type VoiceToolResponse = { id?: string; name: string; response: { result: string } };

const TIMED_OUT = Symbol("timed out");

/** Resolves with the work, or rejects with `message` after `ms`. */
export function withDeadline<T>(work: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(Object.assign(new Error(message), { [TIMED_OUT]: true })), ms);
  });
  return Promise.race([work, deadline]).finally(() => clearTimeout(timer));
}

export function isDeadline(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && TIMED_OUT in error);
}

export class VoiceToolRelay {
  private readonly cancelled = new Set<string>();
  private disposed = false;
  private readonly searchMemories: (query: string, also: string[]) => Promise<string>;
  private readonly send: (responses: VoiceToolResponse[]) => void;
  private readonly handlers: Record<string, VoiceToolHandler>;
  private readonly options: { searchTimeoutMs?: number };

  constructor(
    searchMemories: (query: string, also: string[]) => Promise<string>,
    send: (responses: VoiceToolResponse[]) => void,
    handlers: Record<string, VoiceToolHandler> = {},
    options: { searchTimeoutMs?: number } = {},
  ) {
    this.searchMemories = searchMemories;
    this.send = send;
    this.handlers = handlers;
    this.options = options;
  }

  /** Answers each call as soon as it is ready; a slow call never holds back a fast one. */
  async handle(calls: VoiceToolCall[]): Promise<void> {
    await Promise.all(calls.map(async call => {
      const response = await this.respond(call);
      if (this.disposed || (response.id && this.cancelled.has(response.id))) return;
      this.send([response]);
    }));
  }

  /** The call ended: later results are dropped. */
  dispose(): void {
    this.disposed = true;
  }

  cancel(ids: string[] = []): void {
    for (const id of ids) this.cancelled.add(id);
  }

  private async respond(call: VoiceToolCall): Promise<VoiceToolResponse> {
    const name = call.name ?? "";
    const reply = (result: string): VoiceToolResponse => ({ id: call.id, name, response: { result } });
    const args = call.args ?? {};
    if (Object.prototype.hasOwnProperty.call(this.handlers, name)) {
      try {
        return reply(await this.handlers[name](args, {
          callId: call.id,
          isLive: () => !this.disposed && !(call.id && this.cancelled.has(call.id)),
        }));
      } catch {
        return reply(`${name} failed. Tell the host it did not work.`);
      }
    }
    if (name !== SEARCH_MEMORIES_TOOL) return reply(`Unknown tool ${name}.`);
    const query = typeof args.query === "string" ? args.query.trim() : "";
    if (!query) return reply("No search query was given.");
    const also = Array.isArray(args.also)
      ? args.also.filter((value): value is string => typeof value === "string" && Boolean(value.trim())).slice(0, 5)
      : [];
    try {
      const result = await withDeadline(
        this.searchMemories(query.slice(0, 200), also),
        this.options.searchTimeoutMs ?? VOICE_MEMORY_SEARCH_TIMEOUT_MS,
        "Memory search timed out.",
      );
      return reply(result.trim() || MEMORY_SEARCH_UNAVAILABLE);
    } catch {
      return reply(MEMORY_SEARCH_UNAVAILABLE);
    }
  }
}
