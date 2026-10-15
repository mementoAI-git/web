import type { SessionContext } from "eve/context";

import { ownsSession, readCredential } from "./private-store.ts";

/**
 * Resolves credentials only for the authenticated session owner.
 * @param ctx - Eve runtime session context.
 * @returns The account credential, or null in sample mode.
 */
export async function memoryContext(ctx: SessionContext) {
  return await readOwnedCredential(
    ctx.session.id,
    ctx.session.auth.current?.principalId
  );
}

/** Reads an account connection only when the caller owns the conversation.
 * @param session - The current server-created session ID.
 * @param principal - The verified current caller.
 * @returns The caller’s account connection, or null in sample mode.
 */
export async function readOwnedCredential(session: string, principal?: string) {
  if (
    principal === undefined ||
    principal === "" ||
    !(await ownsSession(session, principal))
  ) {
    throw new Error("Start a new chat in your signed-in sandbox browser.");
  }
  return await readCredential(principal);
}
