import type { IMemory } from "@/utility/interface";
import type {
  Person,
  PendingConnection,
  SharedItem,
  TalkTurn,
  MementoActivation,
} from "@/api/people";
import type { PreviewResponse } from "./preview-session";
const ok = (data: unknown): PreviewResponse => ({
  status: 200,
  body: { success: true, message: "Local People preview", data },
});
const unavailable = (): PreviewResponse => ({
  status: 404,
  body: { success: false, message: "This preview connection is unavailable" },
});
/** Never reads live relationships, sources, credentials or AI transcripts. */
export class PreviewPeople {
  readonly connections: Person[];
  readonly pending: PendingConnection[] = [];
  private readonly blocked: Person[] = [];
  private readonly items = new Map<string, SharedItem[]>();
  private readonly turns = new Map<string, TalkTurn[]>();
  private activation: MementoActivation = {
    state: "private",
    approved_context: "",
    updated_at: null,
  };
  private readonly viewerId: string;
  constructor(viewerId: string, fixtures: Person[] = []) {
    this.viewerId = viewerId;
    this.connections = structuredClone(fixtures);
  }
  request(
    method: string,
    url: URL,
    body: Record<string, unknown>,
    memories: IMemory[],
    createMemory: (body: Record<string, unknown>) => IMemory,
  ): PreviewResponse | undefined {
    const path = url.pathname.replace(/\/$/, "");
    const verb = method.toUpperCase();
    if (
      path === "/beneficiaries" &&
      verb === "POST" &&
      body.access_scope === "shared_only"
    ) {
      const invite = {
        invite_id: `preview-invite-${crypto.randomUUID()}`,
        name: String(body.name || "Connection"),
        email: String(body.email || ""),
        relationship: String(body.relationship || ""),
      };
      this.pending.push(invite);
      return ok({
        ...invite,
        _id: invite.invite_id,
        status: "pending",
        access_scope: "shared_only",
      });
    }
    if (path === "/beneficiaries/invite/resend") return ok(null);
    if (path.startsWith("/beneficiaries/") && verb === "DELETE") {
      const index = this.pending.findIndex(
        (row) => row.invite_id === path.split("/")[2],
      );
      if (index >= 0) this.pending.splice(index, 1);
      return ok(null);
    }
    if (path !== "/people" && !path.startsWith("/people/")) return undefined;
    if (path === "/people")
      return ok({ connections: this.connections, pending: this.pending });
    if (path === "/people/activation") {
      if (verb === "PUT") {
        const context = String(body.approved_context || "").trim();
        if (body.active && !context) return unavailable();
        this.activation = {
          state: body.active ? "active" : context ? "ready" : "private",
          approved_context: context,
          updated_at: new Date().toISOString(),
        };
      }
      return ok(this.activation);
    }
    if (path === "/people/sources") {
      const search = (url.searchParams.get("search") || "").toLowerCase();
      const sources = memories.filter(
        (memory) =>
          memory.type === "story" &&
          memory.status !== "deleted" &&
          memory.title.toLowerCase().includes(search),
      );
      const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
      return ok({
        items: sources.slice((page - 1) * 20, page * 20).map((memory) => ({
          source_id: memory._id,
          title: memory.title,
          original_date: memory.created_at,
        })),
        page,
        has_next_page: page * 20 < sources.length,
      });
    }
    if (path === "/people/blocked")
      return ok(
        this.blocked.map((person) => ({
          user_id: person.user_id,
          name: person.name,
        })),
      );
    if (path.startsWith("/people/blocked/") && verb === "DELETE") {
      const index = this.blocked.findIndex(
        (person) => person.user_id === path.split("/")[3],
      );
      if (index >= 0) this.blocked.splice(index, 1);
      return ok(null);
    }
    const [, , personId, action, sourceId] = path.split("/");
    const person = this.connections.find((row) => row.user_id === personId);
    if (!person) return unavailable();
    const visible = (this.items.get(personId) || []).filter((item) =>
      memories.some(
        (memory) =>
          memory._id === item.source_id && memory.status !== "deleted",
      ),
    );
    if (action === "settings") {
      if (verb === "PATCH")
        person.relationship = String(body.label || "") || null;
      return ok({
        relationship: person.relationship,
        shared_item_count: visible.length,
        privacy: "Only explicitly shared items appear here.",
      });
    }
    if (action === "disconnect") {
      this.connections.splice(this.connections.indexOf(person), 1);
      if (body.block) this.blocked.push(person);
      this.items.delete(personId);
      this.turns.delete(personId);
      return ok(null);
    }
    if (action === "space") {
      const filter = url.searchParams.get("filter") || "all";
      const kind = {
        stories: "story",
        notes: "note",
        photos: "photo",
        videos: "video",
        voice: "voice",
      }[filter];
      const items = kind
        ? visible.filter(
            (item) =>
              item.source_type === kind ||
              item.attachments.some((file) =>
                file.type.startsWith(
                  kind === "photo"
                    ? "image/"
                    : kind === "video"
                      ? "video/"
                      : kind === "voice"
                        ? "audio/"
                        : "no-media",
                ),
              ),
          )
        : visible;
      const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
      return ok({
        shared_space_id: [this.viewerId, personId].sort().join(":"),
        items: items.slice((page - 1) * 20, page * 20),
        total: items.length,
        page,
        has_next_page: page * 20 < items.length,
      });
    }
    if (action === "items" && sourceId) {
      const item = visible.find((row) => row.source_id === sourceId);
      if (!item) return unavailable();
      if (verb === "DELETE") {
        this.items.set(
          personId,
          visible.filter((row) => row !== item),
        );
        return ok(null);
      }
      return ok(item);
    }
    if ((action === "share" || action === "items") && verb === "POST") {
      const memory =
        action === "share"
          ? memories.find(
              (memory) =>
                memory._id === body.source_id && memory.status !== "deleted",
            )
          : createMemory(body);
      if (!memory) return unavailable();
      const existing = visible.find((row) => row.source_id === memory._id);
      if (existing) return ok(existing);
      const item: SharedItem = {
        source_id: memory._id,
        source_type:
          action === "share"
            ? "story"
            : (body.kind as SharedItem["source_type"]),
        title: memory.title,
        body: memory.body,
        original_date: memory.created_at,
        shared_date: new Date().toISOString(),
        contributor: { user_id: this.viewerId, name: "You", avatar_url: null },
        shared_via: action === "share" ? "share_from_memento" : "direct",
        can_remove: true,
        attachments: memory.attachments.map((file) => ({
          _id: file._id,
          type: file.type,
          url: file.url,
          thumbnail: file.thumbnail || null,
          status: "completed",
        })),
      };
      this.items.set(personId, [item, ...visible]);
      return ok(item);
    }
    if (action === "talk") {
      if (person.memento_state !== "active" && !(verb === "GET" ? url.searchParams.get("shared_space") === "true" : body.shared_space === true))
        return verb === "GET"
          ? ok({ available: false, turns: [] })
          : unavailable();
      const turns = this.turns.get(personId) || [];
      if (verb === "GET") return ok({ available: true, turns });
      if (
        body.source_id &&
        !visible.some((item) => item.source_id === body.source_id)
      )
        return unavailable();
      const existing = turns.find(
        (turn) => turn.id === `preview:${body.request_id}:ai`,
      );
      if (existing) return ok(existing);
      const common = {
        created_at: new Date().toISOString(),
        is_voice: Boolean(body.is_voice),
        available: true,
        citations: [],
      };
      const answer: TalkTurn = {
        ...common,
        id: `preview:${body.request_id}:ai`,
        role: "ai",
        text: "This is a local preview response. In your real connection, Talk uses only approved context and memories shared in Our Space.",
      };
      this.turns.set(personId, [
        ...turns,
        {
          ...common,
          id: `preview:${body.request_id}:user`,
          role: "user",
          shared_input_id: typeof body.shared_input_id === "string" ? body.shared_input_id : undefined,
          text: String(body.text),
        },
        answer,
      ]);
      return ok(answer);
    }
    return unavailable();
  }
}
export const peoplePreviewFixtures: Person[] = [
  {
    user_id: "preview-person-tunde",
    name: "Tunde",
    relationship: "Friend",
    avatar_url: null,
    memento_state: "active",
  },
  {
    user_id: "preview-person-amara",
    name: "Amara",
    relationship: "Family",
    avatar_url: null,
    memento_state: "private",
  },
];
