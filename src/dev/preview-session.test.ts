import { describe, expect, it } from "vitest";
import { mockUser } from "@/test/fixtures";
import { PreviewSession } from "./preview-session";

const payload = (
  session: PreviewSession,
  method: string,
  url: string,
  body?: unknown,
) => session.request(method, url, body)?.body.data;

describe("new-user preview session", () => {
  it("keeps memory search local and explicitly uses keyword mode", () => {
    const session = new PreviewSession(mockUser);
    payload(session, "POST", "/memories", {
      title: "Our beach day",
      body: "We watched the waves.",
    });
    const result = payload(session, "GET", "/memories/search?q=beach");
    expect(result).toMatchObject({
      docs: [{ title: "Our beach day" }],
      search: { mode: "keyword", preparing: false },
    });
    expect(
      payload(session, "GET", "/memories/search?q=unrelated"),
    ).toMatchObject({ docs: [] });
  });
  it("isolates new-user billing usage from the real account", () => {
    const session = new PreviewSession(mockUser);
    expect(payload(session, "GET", "/billing/subscription")).toMatchObject({
      tier: "free",
      usage: {
        storage_used_bytes: 0,
        storage_limit_bytes: 200 * 1024 ** 2,
        remaining_bytes: 200 * 1024 ** 2,
      },
    });
    expect(payload(session, "GET", "/memories/stats")).toMatchObject({
      storage: "0 B/200 MB",
    });
  });
  it("blocks live voice credentials requested with GET as well as POST", () => {
    const session = new PreviewSession(mockUser);
    expect(session.request("GET", "/ai/ephemeral-token")).toMatchObject({
      status: 409,
    });
  });
  it("opens a starter topic as an empty local thread and keeps Answered empty initially", () => {
    const session = new PreviewSession(mockUser);
    expect(
      payload(session, "GET", "/prompts/categories/growing-up?answered=true"),
    ).toMatchObject({ docs: [], totalDocs: 0 });
    const memory = payload(
      session,
      "GET",
      "/memories/prompt/preview-prompt-growing-up",
    ) as { _id: string; prompt: string };
    expect(memory).toMatchObject({
      _id: expect.stringMatching(/^preview-/),
      prompt: "preview-prompt-growing-up",
    });
    expect(
      payload(session, "GET", `/ai/prompt/messages/${memory._id}`),
    ).toMatchObject({ messages: [] });
    expect(
      session.request("POST", "/ai/prompt", {
        memory: memory._id,
        text: "My first topic reply",
      }).stream,
    ).toContain("remember");
    expect(
      payload(session, "GET", "/prompts/categories/growing-up?answered=true"),
    ).toMatchObject({
      docs: [expect.objectContaining({ status: "answered" })],
    });
    expect(session.user.primary_conversation_id).toBeNull();
  });

  it("simulates question feedback without removing the topic catalog", () => {
    const session = new PreviewSession(mockUser);
    expect(
      session.request("POST", "/prompts/preview-prompt-growing-up/feedback", {
        status: "skipped",
      }).status,
    ).toBe(200);
    expect(
      payload(session, "GET", "/prompts/categories/growing-up"),
    ).toMatchObject({ docs: [] });
    expect(payload(session, "GET", "/prompts/categories")).toHaveLength(11);
  });
  it("keeps identity and onboarding but starts without a conversation or streak", () => {
    const real = {
      ...mockUser,
      primary_conversation_id: "real-thread",
      streak: 9,
    };
    const session = new PreviewSession(real);
    expect(session.user).toMatchObject({
      nickname: real.nickname,
      onboarded: true,
      onboarding_status: "completed",
      streak: 0,
      primary_conversation_id: null,
    });
    expect(session.user._id).not.toBe(real._id);
    expect(real.primary_conversation_id).toBe("real-thread");
    expect(payload(session, "GET", "/users/profile")).toEqual(session.user);
  });

  it.each([
    "/memories",
    "/memories/stories?page=2&limit=4",
    "/memories/conversations",
    "/capsule",
    "/beneficiaries",
    "/groups",
    "/activities",
  ])("loads a valid empty collection for %s", (url) => {
    expect(payload(new PreviewSession(mockUser), "GET", url)).toMatchObject({
      docs: [],
      totalDocs: 0,
      hasNextPage: false,
    });
  });

  it("keeps unanswered starter reflections, topics, and shuffle allowance", () => {
    const session = new PreviewSession(mockUser);
    expect(payload(session, "GET", "/prompts?date_key=2026-10-09")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ slot_kind: "static", answered: false }),
      ]),
    );
    expect(
      payload(session, "GET", "/prompts/suggestions/overview"),
    ).toHaveLength(7);
    expect(payload(session, "GET", "/prompts/shuffle")).toMatchObject({
      used: 0,
      remaining: 2,
    });
    expect(payload(session, "POST", "/prompts/shuffle")).toMatchObject({
      used: 1,
      remaining: 1,
      allowed: true,
    });
  });

  it("saves a local story that appears in collections and counts", () => {
    const session = new PreviewSession(mockUser);
    const story = payload(session, "POST", "/memories/quick-capture", {
      body: "<p>My first memory</p>",
      visibility: "private",
    }) as { _id: string };
    expect(story._id).toMatch(/^preview-/);
    expect(payload(session, "GET", "/memories/stories")).toMatchObject({
      docs: [expect.objectContaining({ body: "<p>My first memory</p>" })],
      totalDocs: 1,
    });
    expect(payload(session, "GET", "/memories/stats")).toMatchObject({
      stories_count: 1,
    });
    expect(payload(session, "GET", "/users/stats")).toMatchObject({
      stories_count: 1,
      streak_count: 0,
    });
    expect(
      payload(new PreviewSession(mockUser), "GET", "/memories/stories"),
    ).toMatchObject({ docs: [], totalDocs: 0 });
  });

  it("creates a local Chat and returns sample replies and message history", () => {
    const session = new PreviewSession(mockUser);
    const started = payload(session, "POST", "/ai/conversation/new", {
      text: "I remember my childhood",
    }) as { memory_id: string; response: string };
    expect(started.memory_id).toMatch(/^preview-/);
    expect(started.response).toContain("remember");
    expect(session.user.primary_conversation_id).toBe(started.memory_id);
    expect(
      payload(session, "GET", `/ai/prompt/messages/${started.memory_id}`),
    ).toMatchObject({
      messages: [
        expect.objectContaining({ role: "user" }),
        expect.objectContaining({ role: "ai" }),
      ],
      next: null,
    });
    const reply = session.request("POST", "/ai/prompt", {
      memory: started.memory_id,
      text: "Tell me more",
    });
    expect(reply.stream).toBeTruthy();
    expect(
      payload(session, "GET", `/ai/prompt/messages/${started.memory_id}`),
    ).toMatchObject({
      messages: expect.arrayContaining([
        expect.objectContaining({ text: "Tell me more" }),
      ]),
    });
  });

  it("never passes unsupported writes through to the account", () => {
    const session = new PreviewSession(mockUser);
    expect(session.request("POST", "/billing/checkout", {})).toMatchObject({
      status: 409,
      body: { success: false, message: expect.stringContaining("preview") },
    });
    expect(session.request("PUT", "/unknown", {})).toMatchObject({
      status: 409,
    });
    expect(session.request("POST", "/ai/ephemeral-token", {})).toMatchObject({
      status: 409,
    });
    expect(session.request("GET", "/feature-flags")).toBeNull();
    expect(session.request("POST", "/auth/refresh-token", {})).toBeNull();
  });
});
