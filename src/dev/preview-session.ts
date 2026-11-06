import { PreviewPeople } from "./preview-people";
import type { Person } from "@/api/people";
import type {
  IMemory,
  IMessage,
  IPagination,
  IUser,
} from "@/utility/interface";
import {
  FREE_LIMIT_BYTES,
  formatBytes,
} from "@/features/pricing/storage-display";
import {
  createStarterPrompts,
  createStartingStats,
  previewCatalog,
} from "./preview-fixtures";

export interface PreviewResponse {
  status: number;
  body: { success: boolean; message: string; data?: unknown };
  stream?: string;
}

function record(value: unknown): Record<string, unknown> {
  if (typeof value === "string") {
    try {
      return record(JSON.parse(value));
    } catch {
      return {};
    }
  }
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function ok(data: unknown): PreviewResponse {
  return {
    status: 200,
    body: { success: true, message: "Local preview", data },
  };
}

function blocked(): PreviewResponse {
  return {
    status: 409,
    body: {
      success: false,
      message:
        "This action is not simulated in new user preview. Switch preview off to use it.",
    },
  };
}

export class PreviewSession {
  user: IUser;
  readonly storage = new Map<string, string>();
  private readonly memories: IMemory[] = [];
  private readonly messages = new Map<string, IMessage[]>();
  private readonly files = new Map<string, Record<string, unknown>>();
  private readonly objectUrls: string[] = [];
  private readonly listeners = new Set<() => void>();
  private readonly prompts = createStarterPrompts(new Date().toISOString());
  private shuffleUsed = 0;
  revision = 0;
  private readonly people: PreviewPeople;

  constructor(user: IUser, peopleFixtures: Person[] = []) {
    this.user = {
      ...structuredClone(user),
      _id: `preview-user-${crypto.randomUUID()}`,
      primary_conversation_id: null,
      streak: 0,
      onboarded: true,
      onboarding_status: "completed",
      chat_voice: null,
      chat_voice_provider: null,
    };
    this.people = new PreviewPeople(this.user._id, peopleFixtures);
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private changed() {
    this.revision++;
    this.listeners.forEach((listener) => listener());
  }

  dispose() {
    this.objectUrls.forEach((url) => URL.revokeObjectURL(url));
    this.storage.clear();
    this.listeners.clear();
  }

  private page<T>(docs: T[], url: URL): IPagination<T> {
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const limit = Math.max(1, Number(url.searchParams.get("limit")) || 20);
    const totalPages = Math.ceil(docs.length / limit);
    return {
      docs: docs.slice((page - 1) * limit, page * limit),
      totalDocs: docs.length,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
      pagingCounter: docs.length ? (page - 1) * limit + 1 : 0,
    };
  }

  private createMemory(body: Record<string, unknown>, type = "story"): IMemory {
    const now = new Date().toISOString();
    const text = String(body.text ?? body.body ?? "");
    const attachmentIds = Array.isArray(body.attachments)
      ? body.attachments
      : [];
    const memory: IMemory = {
      _id: `preview-${crypto.randomUUID()}`,
      title: String(
        body.title ||
          text.replace(/<[^>]*>/g, "").slice(0, 80) ||
          "My first story",
      ),
      body: text,
      user: this.user._id,
      type,
      status: "active",
      level: 0,
      refrence: "",
      tags: Array.isArray(body.tags) ? body.tags : [],
      attachments: attachmentIds
        .map((file) => (typeof file === "string" ? this.files.get(file) : file))
        .filter(Boolean) as IMemory["attachments"],
      groups: [],
      beneficiaries: [],
      last_opened: now,
      created_at: now,
      updated_at: now,
      visibility: "private",
      capture_source: "quick",
      enrichment_status: "complete",
      ...(body.prompt_id
        ? {
            prompt: String(body.prompt_id),
            prompt_text: String(body.prompt_text ?? body.pinned_text ?? ""),
            reflection_day_key: String(body.reflection_day_key ?? ""),
          }
        : {}),
    };
    this.memories.unshift(memory);
    return memory;
  }

  private addExchange(memory: IMemory, text: string) {
    const reply =
      "Thank you for sharing that. What do you remember most about that moment?";
    const history = this.messages.get(memory._id) ?? [];
    const created_at = new Date().toISOString();
    history.push(
      {
        _id: `preview-${crypto.randomUUID()}`,
        user: this.user._id,
        role: "user",
        text,
        created_at,
      },
      {
        _id: `preview-${crypto.randomUUID()}`,
        user: this.user._id,
        role: "ai",
        text: reply,
        created_at,
      },
    );
    this.messages.set(memory._id, history);
    return reply;
  }

  /** null deliberately permits an infrastructure/catalog read; unknown writes are blocked. */
  request(
    method: string,
    input: string,
    rawBody?: unknown,
  ): PreviewResponse | null {
    const url = new URL(input, "https://preview.local");
    const path = url.pathname.replace(/\/$/, "");
    const body = record(rawBody);
    const write = !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());
    const stories = this.memories.filter(
      (memory) => memory.type === "story" && memory.status !== "deleted",
    );
    const conversations = this.memories.filter(
      (memory) => memory.type === "conversation",
    );
    const storageUsed = [...this.files.values()].reduce(
      (total, file) => total + (typeof file.size === "number" ? file.size : 0),
      0,
    );

    const peopleResponse = this.people.request(
      method,
      url,
      body,
      this.memories,
      (input) => this.createMemory(input),
    );
    if (peopleResponse) {
      if (write) this.changed();
      return peopleResponse;
    }

    // Session refresh stays real. Account/security/billing actions do not.
    if (path === "/auth/refresh-token") return null;
    // The current live-voice client obtains credentials using a GET request.
    if (path === "/ai/ephemeral-token" || path === "/ai/voice-preview")
      return blocked();

    if (!write) {
      if (path === "/billing/subscription")
        return ok({
          tier: "free",
          status: "active",
          usage: {
            storage_used_bytes: storageUsed,
            storage_reserved_bytes: 0,
            storage_limit_bytes: FREE_LIMIT_BYTES,
            remaining_bytes: Math.max(0, FREE_LIMIT_BYTES - storageUsed),
          },
        });
      if (path === "/users/profile") return ok(this.user);
      if (path === "/users/context") return ok(this.user.context ?? {});
      if (path === "/users/stats")
        return ok({
          ...createStartingStats(
            stories.length,
            stories.filter((story) => story.prompt).length,
          ),
          quick_capture_pending_count: 0,
          quick_capture_latest_id: null,
        });
      if (path === "/users/persona") return ok(null);
      if (path === "/users/persona/memory-insights-summary")
        return ok({ summary: null, generated_at: null, cached: false });
      if (path === "/users/insights")
        return ok({
          insights: [],
          generated_at: null,
          next_refresh_at: null,
          generating: false,
        });
      if (path === "/users/insights/sources") return ok({ sources: [] });
      if (path === "/persona/observations")
        return ok({ observations: [], generating: false });
      if (
        path === "/users/passkeys" ||
        path === "/users/referrals" ||
        path === "/billing/invoices"
      )
        return ok([]);
      if (path === "/memories/stats")
        return ok({
          stories_count: stories.length,
          stories_bookmarked_count: stories.filter((story) => story.bookmarked)
            .length,
          stories_deleted_count: this.memories.filter(
            (memory) => memory.status === "deleted",
          ).length,
          media_count: stories.reduce(
            (count, story) => count + story.attachments.length,
            0,
          ),
          bookmark_count: 0,
          storage: `${formatBytes(storageUsed)}/${formatBytes(FREE_LIMIT_BYTES)}`,
        });
      if (path === "/capsule/stats")
        return ok({
          scheduled_count: 0,
          delivered_count: 0,
          paused_count: 0,
          draft_count: 0,
        });
      if (path === "/memories/search") {
        const query = (url.searchParams.get("q") || "")
          .trim()
          .toLocaleLowerCase();
        const docs = this.memories.filter(
          (memory) =>
            !["draft", "deleted"].includes(memory.status) &&
            [memory.title, memory.body, ...(memory.tags || [])].some((value) =>
              String(value || "")
                .toLocaleLowerCase()
                .includes(query),
            ),
        );
        return ok({
          ...this.page(docs, url),
          search: { mode: "keyword", preparing: false },
        });
      }
      if (
        ["/memories", "/memories/stories", "/memories/conversations"].includes(
          path,
        )
      ) {
        let docs = path === "/memories/conversations" ? conversations : stories;
        if (url.searchParams.get("deleted") === "true")
          docs = this.memories.filter((memory) => memory.status === "deleted");
        if (url.searchParams.get("bookmarked") === "true")
          docs = docs.filter((memory) => memory.bookmarked);
        return ok(this.page(docs, url));
      }
      if (
        [
          "/capsule",
          "/beneficiaries",
          "/groups",
          "/groups/search",
          "/files",
        ].includes(path)
      )
        return ok(this.page([], url));
      if (path === "/activities")
        return ok(
          this.page(
            this.memories.map((memory) => ({
              _id: memory._id,
              description: memory.title,
              type: memory.type,
              created_at: memory.created_at,
            })),
            url,
          ),
        );
      if (path.startsWith("/ai/prompt/messages/"))
        return ok({
          messages: this.messages.get(path.split("/").at(-1)) ?? [],
          next: null,
        });
      if (path.endsWith("/enrichment"))
        return ok({
          memory_id: path.split("/")[2],
          dimensions: [],
          category_labels: {},
          message_count: 0,
          last_active: null,
        });
      if (path === "/prompts/shuffle") return ok(this.shuffle());
      if (path === "/prompts")
        return ok(
          this.prompts
            .slice(this.shuffleUsed, this.shuffleUsed + 3)
            .map((prompt) => ({
              slot_kind: "static",
              prompt,
              answered: stories.some((story) => story.prompt === prompt._id),
              reflection_day_key:
                url.searchParams.get("date_key") ??
                new Date().toISOString().slice(0, 10),
              reply_user_count: 0,
            })),
        );
      if (path === "/prompts/suggestions/overview")
        return ok(this.prompts.slice(0, 7));
      if (path === "/prompts/categories") return ok(previewCatalog);
      if (path.startsWith("/prompts/categories/")) {
        const category = path.split("/")[3];
        const prompts = this.prompts
          .filter((prompt) => prompt.category === category)
          .map((prompt) => ({
            ...prompt,
            status: this.memories.some(
              (memory) =>
                memory.prompt === prompt._id &&
                (memory.type === "story" ||
                  (this.messages.get(memory._id)?.length ?? 0) > 0),
            )
              ? "answered"
              : prompt.status,
          }));
        const visible = prompts.filter((prompt) =>
          url.searchParams.get("answered") === "true"
            ? prompt.status === "answered"
            : ["unanswered", "answered"].includes(prompt.status),
        );
        return ok({
          ...this.page(visible, url),
          progress: {
            categorySlug: category,
            starterAnswered: prompts.filter(
              (prompt) => prompt.status === "answered",
            ).length,
            starterTotal: 1,
            personalizedQuestionsEnabled: false,
          },
        });
      }
      if (path.startsWith("/memories/prompt/")) {
        const prompt = this.prompts.find(
          (prompt) => prompt._id === path.split("/").at(-1),
        );
        if (!prompt) return ok(null);
        const memory =
          this.memories.find((memory) => memory.prompt === prompt._id) ??
          this.createMemory(
            {
              title: prompt.title,
              prompt_id: prompt._id,
              prompt_text: prompt.title,
            },
            "prompt",
          );
        return ok(memory);
      }
      if (path.startsWith("/prompts/"))
        return ok(
          this.prompts.find(
            (prompt) => prompt._id === path.split("/").at(-1),
          ) ?? null,
        );
      if (path.startsWith("/memories/"))
        return ok(
          this.memories.find((memory) => memory._id === path.split("/")[2]) ??
            null,
        );
      return null;
    }

    if (/^\/prompts\/[^/]+\/feedback$/.test(path)) {
      const prompt = this.prompts.find(
        (prompt) => prompt._id === path.split("/")[2],
      );
      if (
        !prompt ||
        (body.status !== "skipped" && body.status !== "not-relevant")
      )
        return blocked();
      prompt.status = body.status;
      this.changed();
      return ok(prompt);
    }

    if (path === "/prompts/shuffle") {
      const allowed = this.shuffleUsed < 2;
      if (allowed) this.shuffleUsed++;
      this.changed();
      return ok({ ...this.shuffle(), allowed });
    }
    if (path === "/memories/quick-capture" || path === "/memories") {
      const memory = this.createMemory(body);
      this.changed();
      return ok(memory);
    }
    if (path === "/ai/conversation/new") {
      const memory = this.createMemory(body, "conversation");
      const response = this.addExchange(memory, String(body.text ?? ""));
      this.user = { ...this.user, primary_conversation_id: memory._id };
      this.changed();
      return ok({ memory_id: memory._id, response });
    }
    if (path === "/ai/prompt") {
      const memory = this.memories.find((memory) => memory._id === body.memory);
      if (!memory) return blocked();
      const reply = this.addExchange(memory, String(body.text ?? ""));
      this.changed();
      return { ...ok(null), stream: reply };
    }
    if (path === "/files/upload" && rawBody instanceof FormData) {
      const file = rawBody.get("file");
      if (!(file instanceof File)) return blocked();
      const fileUrl = URL.createObjectURL(file);
      this.objectUrls.push(fileUrl);
      const attachment = {
        _id: `preview-${crypto.randomUUID()}`,
        url: fileUrl,
        name: file.name,
        size: file.size,
        type: file.type,
      };
      this.files.set(attachment._id, attachment);
      return ok(attachment);
    }
    if (path.startsWith("/files/") && method.toUpperCase() === "DELETE") {
      this.files.delete(path.split("/")[2]);
      return ok(null);
    }
    if (path.startsWith("/memories/")) {
      const memory = this.memories.find(
        (memory) => memory._id === path.split("/")[2],
      );
      if (!memory) return blocked();
      if (path.endsWith("/bookmark")) memory.bookmarked = !memory.bookmarked;
      else if (path.endsWith("/restore")) memory.status = "active";
      else if (method.toUpperCase() === "DELETE") memory.status = "deleted";
      else return blocked();
      this.changed();
      return ok(memory);
    }
    return blocked();
  }

  private shuffle() {
    return {
      used: this.shuffleUsed,
      remaining: 2 - this.shuffleUsed,
      limit: 2,
      resets_at: new Date(Date.now() + 86400000).toISOString(),
    };
  }
}

let activeSession: PreviewSession | null = null;
export const getPreviewSession = () => activeSession;
export function setPreviewSession(session: PreviewSession | null) {
  activeSession = session;
}
