import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";

import { readOwnedCredential } from "../agent/lib/memory-context.ts";
import {
  readCredential,
  removeCredential,
  saveSessionOwner,
  ownsSession,
  writeCredential,
} from "../agent/lib/private-store.ts";

let directory = "";
before(async () => {
  directory = await mkdtemp(path.join(tmpdir(), "memento-eve-test-"));
  process.env.SANDBOX_DATA_DIR = directory;
  process.env.EVE_ACCESS_PASSWORD = "test-password-that-is-not-a-real-secret";
});
after(async () => {
  await rm(directory, { recursive: true, force: true });
});

void test("credentials stay encrypted and scoped to a browser principal", async () => {
  await writeCredential("visitor:alice", {
    accessToken: "private-alice-bearer",
    name: "Alice",
  });
  assert.deepEqual(await readCredential("visitor:alice"), {
    accessToken: "private-alice-bearer",
    name: "Alice",
  });
  assert.equal(await readCredential("visitor:bob"), null);
  const files = await readdir(path.join(directory, "accounts"));
  const contents = await readFile(
    path.join(directory, "accounts", files[0]),
    "utf-8"
  );
  assert.equal(contents.includes("private-alice-bearer"), false);
  assert.equal(files[0].includes("alice"), false);
});

void test("password rotation cannot decrypt a previous credential", async () => {
  await writeCredential("visitor:rotation", {
    accessToken: "private-rotation-bearer",
    name: "Alex",
  });
  const original = process.env.EVE_ACCESS_PASSWORD;
  process.env.EVE_ACCESS_PASSWORD = "another-test-password";
  await assert.rejects(readCredential("visitor:rotation"), /Reconnect/u);
  process.env.EVE_ACCESS_PASSWORD = original;
});

void test("disconnect deletes only the current browser credential", async () => {
  await writeCredential("visitor:disconnect", {
    accessToken: "remove-me",
    name: "Alex",
  });
  await removeCredential("visitor:disconnect");
  assert.equal(await readCredential("visitor:disconnect"), null);
  const retained = await readCredential("visitor:alice");
  assert.equal(retained?.name, "Alice");
});

void test("streams, controls and follow-ups require the recorded session owner", async () => {
  assert.equal(await ownsSession("unknown-session", "visitor:alice"), false);
  await saveSessionOwner("session-1", "visitor:alice");
  assert.equal(await ownsSession("session-1", "visitor:alice"), true);
  assert.equal(await ownsSession("session-1", "visitor:bob"), false);
  await assert.rejects(saveSessionOwner("session-1", "visitor:bob"), /owner/u);
  assert.equal(await ownsSession("session-1", "visitor:alice"), true);
});

void test("personal-context reads deny unowned sessions and never fall through to another account", async () => {
  await writeCredential("visitor:context-owner", {
    accessToken: "owner-only-token",
    name: "Owner",
  });
  await saveSessionOwner("context-session", "visitor:context-owner");
  const owner = await readOwnedCredential(
    "context-session",
    "visitor:context-owner"
  );
  assert.equal(owner?.name, "Owner");
  await assert.rejects(
    readOwnedCredential("context-session", "visitor:other"),
    /signed-in/u
  );
  await assert.rejects(readOwnedCredential("context-session"), /signed-in/u);
});
