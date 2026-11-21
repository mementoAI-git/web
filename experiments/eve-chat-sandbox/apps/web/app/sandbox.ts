import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { z } from "zod";

import {
  ACCESS_COOKIE,
  ACCESS_TOKEN_TTL_SECONDS,
  signAccessToken,
  verifyAccessToken,
} from "../../../agent/lib/access";
import { mementoLogin, sampleSearch } from "../../../agent/lib/memories";
import {
  readCredential,
  removeCredential,
  writeCredential,
} from "../../../agent/lib/private-store";

const requireVisitor = createServerOnlyFn(async () => {
  const visitor = await verifyAccessToken(getCookie(ACCESS_COOKIE));
  if (!visitor) {
    throw new Error("Sign in to the sandbox first.");
  }
  return visitor.principalId;
});

const rotateVisitor = createServerOnlyFn(async () => {
  const token = signAccessToken();
  const visitor = await verifyAccessToken(token);
  if (!visitor) {
    throw new Error("Unable to start a private sandbox session.");
  }
  setCookie(ACCESS_COOKIE, token, {
    httpOnly: true,
    maxAge: ACCESS_TOKEN_TTL_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: !import.meta.env.DEV,
  });
  return visitor.principalId;
});

/** Reads model setup and the current visitor’s memory collection. */
export const getSandboxStatus = createServerFn().handler(async () => {
  const principal = await requireVisitor();
  const credential = await readCredential(principal);
  return {
    liveConfigured: (process.env.DEEPSEEK_API_KEY?.length ?? 0) > 0,
    webSearchConfigured: (process.env.OPENROUTER_API_KEY?.length ?? 0) > 0,
    mementoConfigured: Boolean(process.env.MEMENTO_API_URL),
    memoryMode: credential ? ("memento" as const) : ("sample" as const),
    accountName: credential?.name ?? null,
  };
});

/** Searches fictional sample memories without calling a model. */
export const browseSampleMemories = createServerFn()
  .validator(z.object({ query: z.string().trim().min(1).max(200) }))
  .handler(async ({ data }) => {
    await requireVisitor();
    return sampleSearch(data.query);
  });

/** Connects the visitor’s Memento account and rotates their private session. */
export const connectMemento = createServerFn({ method: "POST" })
  .validator(
    z
      .object({
        email: z.email().optional(),
        password: z.string().min(1).max(1024).optional(),
        twoFaToken: z.string().max(4096).optional(),
        code: z
          .string()
          .regex(/^\d{6}$/u)
          .optional(),
      })
      .refine(
        (input) =>
          (input.email !== undefined && input.password !== undefined) ||
          (input.twoFaToken !== undefined && input.code !== undefined),
        "Enter your email and password or verification code."
      )
  )
  .handler(async ({ data }) => {
    const previous = await requireVisitor();
    const result = await mementoLogin(data);
    if (result.kind === "two-factor") {
      return result;
    }
    const principal = await rotateVisitor();
    await writeCredential(principal, {
      accessToken: result.accessToken,
      name: result.name,
    });
    await removeCredential(previous);
    return { kind: "connected" as const, name: result.name };
  });

/** Removes the visitor’s account credentials and starts a fresh sample session. */
export const disconnectMemento = createServerFn({ method: "POST" }).handler(
  async () => {
    const previous = await requireVisitor();
    await removeCredential(previous);
    await rotateVisitor();
    return { ok: true };
  }
);
