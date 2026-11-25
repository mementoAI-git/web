import { z } from "zod";

import { SAMPLE_MEMORIES } from "./sample-memories.ts";

/** A bounded memory excerpt with its source provenance. */
export interface MemorySource {
  id: string;
  title: string;
  excerpt: string;
  date: string | null;
  url: string | null;
  origin: "sample" | "memento";
}

const MAX_RESPONSE_BYTES = 1_048_576;
const MEMORY_ID = /^[\da-f]{24}$/iu;
const querySchema = z.string().max(200).trim();
const tokenSchema = z
  .string()
  .min(1)
  .max(8192)
  .refine(
    (token) =>
      !token
        .split("")
        .some(
          (character) =>
            (character.codePointAt(0) ?? 0) <= 32 ||
            character.codePointAt(0) === 127
        )
  );
const memorySchema = z.object({
  _id: z.string().regex(MEMORY_ID),
  title: z.string(),
  body: z.string().optional(),
  summary: z.string().nullable().optional(),
  created_at: z.string().optional(),
  status: z.enum(["save", "queued", "on_chain", "draft", "deleted"]),
});
const loginInputSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(1024),
});
const twoFactorInputSchema = z.object({
  twoFaToken: tokenSchema,
  code: z.string().regex(/^\d{6}$/u),
});
const sessionSchema = z.union([
  z.object({ requires_2fa: z.literal(true), two_fa_token: tokenSchema }),
  z.object({ access_token: tokenSchema }),
]);
const profileSchema = z.object({ first_name: z.string() });
const personalProfileSchema = z.object({
  first_name: z.string(),
  nickname: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  preferences: z
    .object({
      communication_style: z.string().optional(),
      conversation_tone: z.string().optional(),
      response_length: z.string().optional(),
      topics_of_interest: z.array(z.string()).optional(),
    })
    .nullable()
    .optional(),
});

type ApiMemory = z.infer<typeof memorySchema>;
type LoginBody =
  | z.infer<typeof loginInputSchema>
  | { two_fa_token: string; code: string };

/**
 * Searches Alex's explicitly fictional sample memories.
 * @param query - Search text of at most 200 characters.
 * @returns Matching sample sources.
 */
export function sampleSearch(query: string): MemorySource[] {
  const terms =
    checkedQuery(query)
      .toLowerCase()
      .match(/[\p{L}\p{N}]+/gu) ?? [];
  if (terms.length === 0) {
    return [];
  }
  return SAMPLE_MEMORIES.filter((memory) => {
    const text = `${memory.title} ${memory.excerpt}`.toLowerCase();
    return terms.every((term) => text.includes(term));
  })
    .slice(0, 5)
    .map((memory) => ({ ...memory }));
}

/**
 * Reads a fictional sample memory.
 * @param id - The sample source identifier.
 * @returns The matching source, or null.
 */
export function sampleGet(id: string): MemorySource | null {
  const memory = SAMPLE_MEMORIES.find((source) => source.id === id);
  return memory ? { ...memory } : null;
}

/**
 * Searches only the account authorized by the supplied token.
 * @param token - The account's access token.
 * @param query - Search text of at most 200 characters.
 * @returns Published memory sources.
 */
export async function searchPersonalMemories(
  token: string,
  query: string
): Promise<MemorySource[]> {
  const search = checkedQuery(query);
  checkedToken(token);
  const url = apiUrl("/memories");
  if (search.length === 0) {
    return [];
  }
  url.search = new URLSearchParams({
    search,
    limit: "5",
    page: "1",
  }).toString();
  const data = await request(
    url,
    z.object({ docs: z.array(memorySchema) }),
    token
  );
  return data.docs
    .slice(0, 5)
    .map(memorySource)
    .filter((source): source is MemorySource => source !== null);
}

/** Reads selected account facts without exposing contact or authentication details.
 * @param token - The authenticated account token.
 * @returns Bounded profile facts and explicit communication preferences.
 */
export async function getPersonalProfile(token: string) {
  checkedToken(token);
  const profile = await request(
    apiUrl("/users/profile"),
    personalProfileSchema,
    token
  );
  return {
    name:
      plainText(profile.nickname ?? "", 100) ||
      plainText(profile.first_name, 100),
    country: plainText(profile.country ?? "", 100) || null,
    location: plainText(profile.location ?? "", 200) || null,
    preferences: {
      communicationStyle:
        plainText(profile.preferences?.communication_style ?? "", 100) || null,
      conversationTone:
        plainText(profile.preferences?.conversation_tone ?? "", 100) || null,
      responseLength:
        plainText(profile.preferences?.response_length ?? "", 100) || null,
      topicsOfInterest: (profile.preferences?.topics_of_interest ?? [])
        .slice(0, 10)
        .map((topic) => plainText(topic, 100)),
    },
  };
}

/** Reads a small recent-memory snapshot for broad personal-context requests.
 * @param token - The authenticated account token.
 * @returns At most five published excerpts from the caller’s account.
 */
export async function getRecentPersonalMemories(
  token: string
): Promise<MemorySource[]> {
  checkedToken(token);
  const url = apiUrl("/memories");
  url.search = new URLSearchParams({ limit: "5", page: "1" }).toString();
  const data = await request(
    url,
    z.object({ docs: z.array(memorySchema) }),
    token
  );
  return data.docs
    .slice(0, 5)
    .map(memorySource)
    .filter((source): source is MemorySource => source !== null);
}

/**
 * Reads a memory through the authenticated Memento API.
 * @param token - The account's access token.
 * @param id - A 24-character hexadecimal memory identifier.
 * @returns A source, or null when unavailable.
 */
export async function getPersonalMemory(
  token: string,
  id: string
): Promise<MemorySource | null> {
  if (!MEMORY_ID.test(id)) {
    throw new Error("Invalid Memento memory ID.");
  }
  checkedToken(token);
  const data = await request(
    apiUrl(`/memories/${id}`),
    memorySchema.nullable(),
    token,
    undefined,
    true
  );
  if (data === null) {
    return null;
  }
  const source = memorySource(data);
  if (source && source.id.toLowerCase() !== id.toLowerCase()) {
    throw invalidResponse();
  }
  return source;
}

/**
 * Signs in and verifies the account profile before connecting.
 * @param input - Email and password, or a pending two-factor token and code.
 * @returns A two-factor challenge or a verified account session.
 */
export async function mementoLogin(input: {
  email?: string;
  password?: string;
  twoFaToken?: string;
  code?: string;
}): Promise<
  | { kind: "two-factor"; token: string }
  | { kind: "connected"; accessToken: string; name: string }
> {
  let path: string;
  let body: LoginBody;
  if (input.twoFaToken === undefined) {
    const parsed = loginInputSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error("Enter a valid email and password.");
    }
    path = "/auth/login";
    body = parsed.data;
  } else {
    const parsed = twoFactorInputSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error("Enter a valid six-digit verification code.");
    }
    path = "/auth/2fa/verify";
    body = { two_fa_token: parsed.data.twoFaToken, code: parsed.data.code };
  }
  const session = await request(apiUrl(path), sessionSchema, undefined, body);
  if ("requires_2fa" in session) {
    return { kind: "two-factor", token: session.two_fa_token };
  }
  const profile = await request(
    apiUrl("/users/profile"),
    profileSchema,
    session.access_token
  );
  return {
    kind: "connected",
    accessToken: session.access_token,
    name: plainText(profile.first_name, 100) || "Memento member",
  };
}

function checkedQuery(query: string): string {
  const parsed = querySchema.safeParse(query);
  if (!parsed.success) {
    throw new Error("Memory query must be at most 200 characters.");
  }
  return parsed.data;
}

function checkedToken(token: string): void {
  if (!tokenSchema.safeParse(token).success) {
    throw new Error("Invalid Memento access token. Please sign in again.");
  }
}

function configuredUrl(value: string | undefined): URL | null {
  if (value === undefined || value.length === 0) {
    return null;
  }
  try {
    const url = new URL(value);
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (
      (url.protocol !== "https:" && !(url.protocol === "http:" && local)) ||
      url.username.length > 0 ||
      url.password.length > 0 ||
      url.search.length > 0 ||
      url.hash.length > 0
    ) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

function apiUrl(path: string): URL {
  const base = configuredUrl(process.env.MEMENTO_API_URL);
  if (!base || !/\/api\/?$/u.test(base.pathname)) {
    throw new Error(
      "Configure MEMENTO_API_URL with an HTTPS API URL ending in /api (HTTP localhost is supported)."
    );
  }
  return new URL(`${base.href.replace(/\/$/u, "")}${path}`);
}

function sourceUrl(id: string): string | null {
  const base = configuredUrl(process.env.MEMENTO_WEB_URL);
  return base
    ? new URL(`${base.href.replace(/\/$/u, "")}/stories/${id}`).href
    : null;
}

async function request<T>(
  url: URL,
  schema: z.ZodType<T>,
  token?: string,
  body?: LoginBody,
  allowMissing = false
): Promise<T> {
  try {
    const headers = new Headers({ Accept: "application/json" });
    if (token === undefined) {
      headers.delete("Authorization");
    } else {
      headers.set("Authorization", `Bearer ${token}`);
    }
    if (body) {
      headers.set("Content-Type", "application/json");
    }
    const response = await fetch(url, {
      method: body ? "POST" : "GET",
      headers,
      body: body ? JSON.stringify(body) : undefined,
      redirect: "error",
      signal: AbortSignal.timeout(8000),
    });
    if (allowMissing && response.status === 404) {
      await response.body?.cancel();
      return schema.parse(null);
    }
    if (!response.ok) {
      await response.body?.cancel();
      throw invalidResponse();
    }
    const declaredSize = Number(response.headers.get("Content-Length"));
    if (declaredSize > MAX_RESPONSE_BYTES || !response.body) {
      await response.body?.cancel();
      throw invalidResponse();
    }
    const chunks = await consume(response.body.getReader());
    const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString("utf-8"));
    return z.object({ data: schema }).parse(parsed).data;
  } catch {
    throw new Error(
      "Memento request failed or returned an invalid response. Please try again or sign in again."
    );
  }
}

async function consume(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  chunks: Uint8Array[] = [],
  size = 0
): Promise<Uint8Array[]> {
  const chunk = await reader.read();
  if (chunk.done) {
    return chunks;
  }
  const nextSize = size + chunk.value.byteLength;
  if (nextSize > MAX_RESPONSE_BYTES) {
    await reader.cancel();
    throw invalidResponse();
  }
  chunks.push(chunk.value);
  return await consume(reader, chunks, nextSize);
}

function invalidResponse(): Error {
  return new Error("Memento returned an invalid response.");
}

function plainText(value: string, limit: number): string {
  const entities = new Map([
    ["amp", "&"],
    ["lt", "<"],
    ["gt", ">"],
    ["quot", '"'],
    ["apos", "'"],
    ["nbsp", " "],
  ]);
  return value
    .replaceAll(/<script\b[^>]*>[\s\S]*?<\/script>/giu, " ")
    .replaceAll(/<style\b[^>]*>[\s\S]*?<\/style>/giu, " ")
    .replaceAll(/<[^>]*>/gu, " ")
    .replaceAll(
      /&(?:amp|lt|gt|quot|apos|nbsp);/gu,
      (entity) => entities.get(entity.slice(1, -1)) ?? " "
    )
    .replaceAll(/\s+/gu, " ")
    .trim()
    .slice(0, limit);
}

function memorySource(memory: ApiMemory): MemorySource | null {
  if (memory.status === "draft" || memory.status === "deleted") {
    return null;
  }
  const content =
    (memory.summary?.trim().length ?? 0) > 0 ? memory.summary : memory.body;
  if (content === undefined || content === null) {
    throw invalidResponse();
  }
  const date =
    memory.created_at !== undefined &&
    Number.isFinite(Date.parse(memory.created_at))
      ? memory.created_at
      : null;
  return {
    id: memory._id,
    title: plainText(memory.title, 200),
    excerpt: plainText(content, 1000),
    date,
    url: sourceUrl(memory._id),
    origin: "memento",
  };
}
