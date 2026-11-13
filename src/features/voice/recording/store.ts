import { mutate } from "swr";
import endpoint from "@/api/endpoint";
import { post } from "@/api/mutations";
import type { RecordingSegment, SpeechSpan } from "./call-recording";
import {
  buildRecordingSaveBody,
  CallRecordingOutbox,
  recordingSavePath,
  type RecordingOutboxEntry,
  type RecordingOutboxStorage,
} from "./outbox";

const DB_NAME = "memento-voice";
const STORE = "call-recordings";
/** One sender across tabs: two tabs draining at once would upload the audio twice. */
const LOCK_NAME = "memento-call-recordings";
const UPLOAD_TIMEOUT_MS = 120_000;

type StoredEntry = RecordingOutboxEntry & { key: string; userId: string };

let database: Promise<IDBDatabase> | null = null;

function openDatabase() {
  database ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE, { keyPath: "key" }).createIndex("userId", "userId");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  }).catch((error) => {
    database = null;
    throw error;
  });
  return database;
}

async function transact<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDatabase();
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE, mode);
    const request = work(transaction.objectStore(STORE));
    transaction.oncomplete = () => resolve(request.result);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

/** An account's recordings in IndexedDB, which keeps the audio Blob as it is. */
function indexedDbStorage(userId: string): RecordingOutboxStorage {
  return {
    list: async () => {
      const stored = await transact<StoredEntry[]>("readonly", (store) => store.index("userId").getAll(userId));
      return stored.map(({ key: _key, userId: _user, ...entry }) => entry);
    },
    put: async (entry) => {
      await transact("readwrite", (store) => store.put({ ...entry, key: `${userId}:${entry.sessionId}`, userId }));
    },
    remove: async (sessionId) => {
      await transact("readwrite", (store) => store.delete(`${userId}:${sessionId}`));
    },
  };
}

const outboxes = new Map<string, CallRecordingOutbox>();

function getOutbox(userId: string) {
  let outbox = outboxes.get(userId);
  if (!outbox) {
    outbox = new CallRecordingOutbox(indexedDbStorage(userId));
    outboxes.set(userId, outbox);
  }
  return outbox;
}

async function upload(entry: RecordingOutboxEntry): Promise<string> {
  const form = new FormData();
  form.append("file", new File([entry.audio], entry.fileName, { type: entry.audio.type }));
  form.append("duration", String(Math.round(entry.durationSeconds)));
  const response = await post<{ _id: string } | Array<{ _id: string }>>(endpoint.upload, form, {
    // The client's JSON default would serialise the form; this lets the browser set the boundary.
    headers: { "Content-Type": "multipart/form-data" },
    timeout: UPLOAD_TIMEOUT_MS,
    skipErrorHandling: true,
  });
  const file = Array.isArray(response?.data) ? response.data[0] : response?.data;
  if (!file?._id) throw new Error("The recording upload returned no file.");
  return file._id;
}

async function save(entry: RecordingOutboxEntry) {
  await post(recordingSavePath(entry.sessionId), buildRecordingSaveBody(entry), { skipErrorHandling: true });
  void mutate((key) => typeof key === "string" && key.startsWith(endpoint.memories));
}

function withSenderLock<T>(task: () => Promise<T>, idle: T): Promise<T> {
  const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;
  if (!locks) return task();
  // Another tab is already sending; it will send this account's recordings too.
  return locks.request(LOCK_NAME, { ifAvailable: true }, (lock) => (lock ? task() : idle)) as Promise<T>;
}

/** Sends recordings earlier calls left in this browser. Resolves how many were saved. */
export function drainCallRecordings(userId: string): Promise<number> {
  if (typeof indexedDB === "undefined") return Promise.resolve(0);
  return withSenderLock(() => getOutbox(userId).drain({ upload, save }), 0);
}

/** `voice_call_…` marks a recorded conversation across the apps; m4a matches mobile's recordings. */
export function recordingFileName(mimeType: string, now = Date.now()) {
  if (mimeType.includes("mp4") || mimeType.includes("m4a")) return { name: `voice_call_${now}.m4a`, type: "audio/m4a" };
  if (mimeType.includes("ogg")) return { name: `voice_call_${now}.ogg`, type: "audio/ogg" };
  return { name: `voice_call_${now}.webm`, type: "audio/webm" };
}

/**
 * Keeps a finished call's recording and saves it as a story: written to the
 * outbox first (so nothing is lost), then sent. Resolves `sent` once the story
 * is saved, or `queued` when it waits in this browser for the next send.
 */
export async function finishCallRecording({
  userId,
  sessionId,
  recording,
}: {
  userId: string;
  sessionId: string;
  recording: { audio: Blob; mimeType: string; durationMs: number; segments: RecordingSegment[]; speech: SpeechSpan[] };
}): Promise<"sent" | "queued"> {
  const { name, type } = recordingFileName(recording.mimeType);
  const outbox = getOutbox(userId);
  await outbox.add({
    sessionId,
    audio: recording.audio.type === type ? recording.audio : new Blob([recording.audio], { type }),
    fileName: name,
    durationSeconds: recording.durationMs / 1000,
    segments: recording.segments,
    speech: recording.speech,
  });
  await drainCallRecordings(userId);
  const pending = (await outbox.entries()).some((entry) => entry.sessionId === sessionId);
  return pending ? "queued" : "sent";
}
