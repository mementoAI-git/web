import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  scryptSync,
} from "node:crypto";
import { link, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { z } from "zod";

const credentialSchema = z.object({
  accessToken: z.string().min(1).max(16_384),
  name: z.string().max(200),
});
/** Server-only credential encrypted per sandbox browser. */
export type Credential = z.infer<typeof credentialSchema>;

function privatePath(kind: string, identity: string): string {
  if (!identity || identity.length > 500) {
    throw new Error("Missing sandbox identity.");
  }
  const root = path.resolve(process.env.SANDBOX_DATA_DIR ?? ".sandbox-data");
  return path.join(
    root,
    kind,
    `${createHash("sha256").update(identity).digest("hex")}.json`
  );
}

function encryptionKey(): Buffer {
  const password = process.env.EVE_ACCESS_PASSWORD;
  if (password === undefined || password === "") {
    throw new Error("Set the sandbox access password first.");
  }
  return scryptSync(password, "memento-eve-credentials:v1", 32);
}

async function prepareDirectory(file: string): Promise<void> {
  await mkdir(path.resolve(file, ".."), { recursive: true, mode: 0o700 });
}

/**
 * Encrypts an account token bound to its browser principal.
 * @param principal - Verified browser identity.
 * @param credential - Account token and display name.
 */
export async function writeCredential(
  principal: string,
  credential: Credential
): Promise<void> {
  const content = credentialSchema.parse(credential);
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), nonce);
  cipher.setAAD(Buffer.from(principal));
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(content), "utf-8"),
    cipher.final(),
  ]);
  const file = privatePath("accounts", principal);
  await prepareDirectory(file);
  await writeFile(
    file,
    JSON.stringify({
      nonce: nonce.toString("base64url"),
      tag: cipher.getAuthTag().toString("base64url"),
      ciphertext: ciphertext.toString("base64url"),
    }),
    { mode: 0o600 }
  );
}

/**
 * Reads the browser's encrypted account token.
 * @param principal - Verified browser identity.
 * @returns The credential, or null in sample mode.
 */
export async function readCredential(
  principal: string
): Promise<Credential | null> {
  let raw: string;
  try {
    raw = await readFile(privatePath("accounts", principal), "utf-8");
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return null;
    }
    throw new Error(
      "Memory connection is unavailable. Reconnect your account.",
      { cause: error }
    );
  }
  try {
    const envelope = z
      .object({ nonce: z.string(), tag: z.string(), ciphertext: z.string() })
      .parse(JSON.parse(raw));
    const decipher = createDecipheriv(
      "aes-256-gcm",
      encryptionKey(),
      Buffer.from(envelope.nonce, "base64url")
    );
    decipher.setAAD(Buffer.from(principal));
    decipher.setAuthTag(Buffer.from(envelope.tag, "base64url"));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(envelope.ciphertext, "base64url")),
      decipher.final(),
    ]).toString("utf-8");
    return credentialSchema.parse(JSON.parse(plaintext));
  } catch {
    throw new Error(
      "Memory connection is unavailable. Reconnect your account."
    );
  }
}

/**
 * Deletes the browser's stored connection.
 * @param principal - Verified browser identity.
 */
export async function removeCredential(principal: string): Promise<void> {
  await rm(privatePath("accounts", principal), { force: true });
}

/**
 * Records the first owner without allowing replacement.
 * @param session - Eve's server-created session ID.
 * @param principal - Verified browser identity.
 */
export async function saveSessionOwner(
  session: string,
  principal: string
): Promise<void> {
  const file = privatePath("sessions", session);
  await prepareDirectory(file);
  const temporary = `${file}.${randomBytes(8).toString("hex")}.tmp`;
  await writeFile(temporary, principal, { flag: "wx", mode: 0o600 });
  try {
    await link(temporary, file);
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "EEXIST" &&
      (await ownsSession(session, principal))
    ) {
      return;
    }
    throw new Error("Unable to register session owner.", { cause: error });
  } finally {
    await rm(temporary, { force: true });
  }
}

/**
 * Checks session ownership before reads and controls.
 * @param session - Eve's server-created session ID.
 * @param principal - Verified browser identity.
 * @returns Whether the browser owns this session.
 */
export async function ownsSession(
  session: string,
  principal: string
): Promise<boolean> {
  try {
    return (
      (await readFile(privatePath("sessions", session), "utf-8")) === principal
    );
  } catch {
    return false;
  }
}
