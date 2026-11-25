import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { z } from "zod";

import {
  getPersonalMemory,
  getPersonalProfile,
  getRecentPersonalMemories,
  mementoLogin,
  sampleGet,
  sampleSearch,
  searchPersonalMemories,
} from "../agent/lib/memories.ts";
import { getPersonalContext } from "../agent/lib/personal-context.ts";

const originalFetch = globalThis.fetch;
const memoryId = "0123456789abcdef01234567";
const memory = {
  _id: memoryId,
  title: "Sunday lunch",
  body: "<p>Family &amp; friends</p>",
  created_at: "2026-01-01T00:00:00Z",
  status: "save",
  password: "private",
  url: "https://evil.test",
};
afterEach(() => {
  globalThis.fetch = originalFetch;
  delete process.env.MEMENTO_API_URL;
  delete process.env.MEMENTO_WEB_URL;
});
type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };
function respond(data: JsonValue) {
  return Response.json({ data });
}
function requestUrl(input: string | URL | Request): URL {
  assert.ok(input instanceof URL);
  return input;
}
function requestBody(options: RequestInit | undefined): string {
  return z.string().parse(options?.body);
}
function setup() {
  process.env.MEMENTO_API_URL = "https://api.example.test/api";
}

void test("sample search returns relevant fictional memories with provenance", () => {
  const results = sampleSearch("Lisbon vacation");
  assert.equal(results.length, 1);
  assert.equal(results[0].origin, "sample");
  assert.match(results[0].excerpt, /fictional/iu);
  assert.equal(sampleGet(results[0].id)?.title, results[0].title);
  assert.deepEqual(sampleSearch("unicorn quantum banana"), []);
  assert.deepEqual(sampleSearch(""), []);
  assert.equal(sampleGet("missing"), null);
});

void test("personal search uses caller token and bounded safe sources", async () => {
  setup();
  process.env.MEMENTO_WEB_URL = "https://memento.example.test";
  globalThis.fetch = async (input, options) => {
    const url = requestUrl(input);
    assert.equal(url.pathname, "/api/memories");
    assert.equal(url.searchParams.get("search"), "lunch");
    assert.equal(url.searchParams.get("limit"), "5");
    assert.equal(url.searchParams.get("page"), "1");
    assert.equal(
      new Headers(options?.headers).get("authorization"),
      "Bearer caller-token"
    );
    assert.equal(options?.redirect, "error");
    assert.ok(options?.signal);
    return respond({
      docs: [
        memory,
        { ...memory, status: "draft" },
        { ...memory, status: "deleted" },
      ],
    });
  };
  const results = await searchPersonalMemories("caller-token", "lunch");
  assert.deepEqual(results, [
    {
      id: memoryId,
      title: "Sunday lunch",
      excerpt: "Family & friends",
      date: memory.created_at,
      url: `https://memento.example.test/stories/${memoryId}`,
      origin: "memento",
    },
  ]);
  assert.doesNotMatch(JSON.stringify(results), /private|caller-token|evil/u);
});

void test("personal get excludes unavailable memories and unsafe configured links", async () => {
  setup();
  process.env.MEMENTO_WEB_URL = "http://evil.test";
  globalThis.fetch = async () => respond(memory);
  const source = await getPersonalMemory("token", memoryId);
  assert.equal(source?.url, null);
  globalThis.fetch = async () => respond({ ...memory, status: "deleted" });
  assert.equal(await getPersonalMemory("token", memoryId), null);
  globalThis.fetch = async () => new Response("secret", { status: 404 });
  assert.equal(await getPersonalMemory("token", memoryId), null);
});

void test("adapter rejects bad configuration and input before network access", async () => {
  globalThis.fetch = async () => {
    throw new Error("unexpected fetch");
  };
  await assert.rejects(
    searchPersonalMemories("token", "lunch"),
    /MEMENTO_API_URL/u
  );
  setup();
  await assert.rejects(
    searchPersonalMemories("token", "x".repeat(201)),
    /query/iu
  );
  await assert.rejects(getPersonalMemory("token", "../users"), /memory ID/iu);
  await assert.rejects(
    searchPersonalMemories("bad\nheader", "lunch"),
    /token/iu
  );
});

void test("API failures and malformed or oversized bodies are redacted", async () => {
  setup();
  for (const response of [
    new Response("credential-secret", { status: 401 }),
    new Response("credential-secret"),
    respond({ docs: "wrong" }),
    new Response("x".repeat(1_048_577)),
  ]) {
    globalThis.fetch = async () => response;
    await assert.rejects(
      searchPersonalMemories("token", "lunch"),
      (error: Error) =>
        error instanceof Error && !error.message.includes("credential-secret")
    );
  }
  globalThis.fetch = async () => {
    throw new Error("credential-secret");
  };
  await assert.rejects(
    searchPersonalMemories("token", "lunch"),
    /Memento request failed/u
  );
});

void test("login returns two factor challenge using actual API fields", async () => {
  setup();
  globalThis.fetch = async (input, options) => {
    assert.equal(
      requestUrl(input).href,
      "https://api.example.test/api/auth/login"
    );
    assert.deepEqual(JSON.parse(requestBody(options)), {
      email: "alex@example.test",
      password: "password",
    });
    return respond({ requires_2fa: true, two_fa_token: "pending-token" });
  };
  assert.deepEqual(
    await mementoLogin({ email: "alex@example.test", password: "password" }),
    { kind: "two-factor", token: "pending-token" }
  );
});

void test("two factor verification verifies access token with account profile", async () => {
  setup();
  let requests = 0;
  globalThis.fetch = async (input, options) => {
    requests += 1;
    if (requests === 1) {
      assert.equal(
        requestUrl(input).href,
        "https://api.example.test/api/auth/2fa/verify"
      );
      assert.deepEqual(JSON.parse(requestBody(options)), {
        two_fa_token: "pending-token",
        code: "123456",
      });
      return respond({
        access_token: "access-token",
        refresh_token: "do-not-return",
      });
    }
    assert.equal(
      requestUrl(input).href,
      "https://api.example.test/api/users/profile"
    );
    assert.equal(
      new Headers(options?.headers).get("authorization"),
      "Bearer access-token"
    );
    return respond({ first_name: "Alex" });
  };
  assert.deepEqual(
    await mementoLogin({ twoFaToken: "pending-token", code: "123456" }),
    { kind: "connected", accessToken: "access-token", name: "Alex" }
  );
  assert.equal(requests, 2);
});

void test("login rejects malformed session and unverified profile", async () => {
  setup();
  globalThis.fetch = async () => respond({ token: "untrusted" });
  await assert.rejects(
    mementoLogin({ email: "a@b.test", password: "password" }),
    /invalid response/iu
  );
  let requests = 0;
  globalThis.fetch = async () => {
    requests += 1;
    return requests === 1
      ? respond({ access_token: "token" })
      : new Response("secret", { status: 401 });
  };
  await assert.rejects(
    mementoLogin({ email: "a@b.test", password: "password" }),
    /Memento/u
  );
});

void test("empty personal queries do not scan account memories", async () => {
  setup();
  globalThis.fetch = async () => {
    throw new Error("Empty queries must never fetch");
  };
  assert.deepEqual(await searchPersonalMemories("token", "   "), []);
});

void test("memory retrieval uses GET without a request body or user selector", async () => {
  setup();
  globalThis.fetch = async (input, options) => {
    const url = requestUrl(input);
    assert.equal(options?.method, "GET");
    assert.equal(options?.body, undefined);
    assert.equal(url.searchParams.has("user"), false);
    assert.equal(url.searchParams.has("user_id"), false);
    return url.pathname.endsWith(memoryId)
      ? respond(memory)
      : respond({ docs: [memory] });
  };
  await searchPersonalMemories("token", "lunch");
  await getPersonalMemory("token", memoryId);
});

void test("memory excerpts strip active HTML and remain bounded", async () => {
  setup();
  globalThis.fetch = async () =>
    respond({
      ...memory,
      body: `<script>secret-script</script><style>secret-style</style><p>${"x".repeat(1500)}</p>`,
      created_at: "invalid date",
    });
  const source = await getPersonalMemory("token", memoryId);
  assert.ok(source);
  assert.equal(source.excerpt.length, 1000);
  assert.doesNotMatch(source.excerpt, /secret|<|>/u);
  assert.equal(source.date, null);
});

void test("links support local configured web origins and reject credential origins", async () => {
  setup();
  globalThis.fetch = async () => respond(memory);
  process.env.MEMENTO_WEB_URL = "http://localhost:5173";
  const local = await getPersonalMemory("token", memoryId);
  assert.equal(local?.url, `http://localhost:5173/stories/${memoryId}`);
  process.env.MEMENTO_WEB_URL = "https://user:password@memento.example.test";
  const credentialUrl = await getPersonalMemory("token", memoryId);
  assert.equal(credentialUrl?.url, null);
});

void test("documented gardening query finds Mum's fictional memory", () => {
  assert.ok(
    sampleSearch("gardening").some(
      (source) => source.id === "sample-mum-garden"
    )
  );
});

void test("personal profile returns selected bounded facts without contact or security fields", async () => {
  setup();
  globalThis.fetch = async (input, options) => {
    assert.equal(requestUrl(input).pathname, "/api/users/profile");
    assert.equal(
      new Headers(options?.headers).get("authorization"),
      "Bearer caller-token"
    );
    assert.equal(options?.method, "GET");
    assert.equal(options?.body, undefined);
    return respond({
      first_name: "<b>Ada</b>",
      nickname: "Ada",
      country: "Nigeria",
      location: "Lagos",
      email: "private@example.test",
      phone_number: "private-phone",
      passkeys: [{ credential_id: "private-passkey" }],
      preferences: {
        communication_style: "friendly",
        conversation_tone: "calm",
        response_length: "short",
        topics_of_interest: Array.from({ length: 15 }, () => "gardening"),
        hidden: "private-preference",
      },
    });
  };
  const result = await getPersonalProfile("caller-token");
  assert.equal(result.name, "Ada");
  assert.equal(result.preferences.topicsOfInterest.length, 10);
  assert.equal(result.preferences.responseLength, "short");
  assert.doesNotMatch(
    JSON.stringify(result),
    /private|caller-token|credential_id/u
  );
});

void test("general personal context uses a bounded account snapshot without a guessed search query", async () => {
  setup();
  globalThis.fetch = async (input, options) => {
    const url = requestUrl(input);
    assert.equal(url.pathname, "/api/memories");
    assert.equal(url.searchParams.get("search"), null);
    assert.equal(url.searchParams.get("limit"), "5");
    assert.equal(url.searchParams.get("page"), "1");
    assert.equal(
      new Headers(options?.headers).get("authorization"),
      "Bearer caller-token"
    );
    return respond({ docs: [memory, { ...memory, status: "draft" }] });
  };
  const result = await getRecentPersonalMemories("caller-token");
  assert.equal(result.length, 1);
  assert.equal(result[0]?.origin, "memento");
});

void test("personal context preserves available profile facts when the memory API fails", async () => {
  setup();
  globalThis.fetch = async (input) =>
    requestUrl(input).pathname === "/api/users/profile"
      ? respond({ first_name: "Ada" })
      : new Response("private failure", { status: 503 });
  const result = await getPersonalContext("caller-token");
  assert.equal(result.profile?.name, "Ada");
  assert.equal(result.profileAvailable, true);
  assert.equal(result.memoryOverviewAvailable, false);
  assert.deepEqual(result.memories, []);
  assert.doesNotMatch(JSON.stringify(result), /private failure|caller-token/u);
});
