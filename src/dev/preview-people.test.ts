import { it, expect } from "vitest";
import { mockUser } from "@/test/fixtures";
import { PreviewSession } from "./preview-session";
import { peoplePreviewFixtures } from "./preview-people";
const data = (
  session: PreviewSession,
  method: string,
  path: string,
  body?: unknown,
) => session.request(method, path, body)?.body.data;
it("keeps new-user People empty, simulates pending invitations, and never falls through unknown People reads", () => {
  const session = new PreviewSession(mockUser);
  expect(data(session, "GET", "/people")).toEqual({
    connections: [],
    pending: [],
  });
  session.request("POST", "/beneficiaries", {
    name: "Friend",
    email: "friend@example.com",
    access_scope: "shared_only",
  });
  expect(data(session, "GET", "/people")).toMatchObject({
    connections: [],
    pending: [{ name: "Friend" }],
  });
  expect(session.request("GET", "/people/real-person/talk").status).toBe(404);
  expect(session.request("GET", "/people/unknown-endpoint").status).toBe(404);
});
it("uses only optional local fixtures for sharing, Talk and removal without duplicating sources", () => {
  const session = new PreviewSession(mockUser, peoplePreviewFixtures);
  const id = peoplePreviewFixtures[0].user_id;
  const source = data(session, "POST", "/memories/quick-capture", {
    title: "Walk",
    body: "A walk",
  }) as { _id: string };
  const item = data(session, "POST", `/people/${id}/share`, {
    source_id: source._id,
  });
  expect(item).toMatchObject({ source_id: source._id, can_remove: true });
  session.request("POST", `/people/${id}/share`, { source_id: source._id });
  expect(data(session, "GET", `/people/${id}/space`)).toMatchObject({
    total: 1,
  });
  expect(data(session, "GET", "/memories/stories")).toMatchObject({
    totalDocs: 1,
  });
  const payload = { text: "Tell me", request_id: crypto.randomUUID() };
  expect(data(session, "POST", `/people/${id}/talk`, payload)).toMatchObject({
    text: expect.stringContaining("local preview"),
  });
  session.request("POST", `/people/${id}/talk`, payload);
  expect(data(session, "GET", `/people/${id}/talk`)).toMatchObject({
    turns: [{ role: "user" }, { role: "ai" }],
  });
  session.request("POST", `/people/${id}/disconnect`, { block: true });
  expect(session.request("GET", `/people/${id}/space`).status).toBe(404);
  expect(data(session, "GET", "/people/blocked")).toMatchObject([
    { user_id: id },
  ]);
  expect(data(session, "GET", "/memories/stories")).toMatchObject({
    totalDocs: 1,
  });
  expect(data(new PreviewSession(mockUser), "GET", "/people")).toEqual({
    connections: [],
    pending: [],
  });
});
