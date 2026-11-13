import type { RecordingSegment, SpeechSpan } from "./call-recording";

/**
 * Outbox for recorded voice conversations (mobile:
 * src/features/chat/call-recording-outbox.ts). A finished recording is stored
 * here before anything is sent, so it survives a dead network or a closed tab,
 * and leaves only once the server has saved it as a story. The server is
 * idempotent per call session, so sending again is safe, and an upload that
 * already succeeded is not repeated.
 */

export type RecordingOutboxEntry = {
  sessionId: string;
  audio: Blob;
  /** File name for the upload; `voice_call_…` marks it as a voice recording across the apps. */
  fileName: string;
  durationSeconds: number;
  segments: RecordingSegment[];
  /** When someone was audible; the rest is silence. */
  speech?: SpeechSpan[];
  /** Set once the audio is uploaded. */
  fileId?: string;
  /** Set once the audio is given up on; only the transcript is saved. */
  audioOmitted?: AudioOmittedReason;
  savedAt: number;
};

/** Why a call's audio could not be kept (the API's audio_omitted values). */
export type AudioOmittedReason = "too_large" | "storage_full" | "upload_failed";

/**
 * An upload failure that will never succeed on retry: the file is over the
 * upload limit, or the member's storage is full. Anything else (no network,
 * a server hiccup) is worth retrying, so it returns null. Mirrors mobile.
 */
export function audioOmittedReason(error: unknown): AudioOmittedReason | null {
  const failure = error as { httpStatus?: number; status?: number; code?: string } | null;
  const status = failure?.httpStatus ?? failure?.status;
  if (status === 413 || failure?.code === "payload_too_large") return "too_large";
  if (failure?.code === "storage_quota_exceeded") return "storage_full";
  return null;
}

/** Whether a transcript has anything worth saving on its own. */
function hasWords(entry: Pick<RecordingOutboxEntry, "segments">) {
  return entry.segments.some((segment) => segment.text.trim().length > 0);
}

/** One account's saved recordings. */
export type RecordingOutboxStorage = {
  list(): Promise<RecordingOutboxEntry[]>;
  put(entry: RecordingOutboxEntry): Promise<void>;
  remove(sessionId: string): Promise<void>;
};

export type RecordingOutboxDeps = {
  /** Uploads the audio, resolving the stored file id. */
  upload(entry: RecordingOutboxEntry): Promise<string>;
  /** Saves the call as a story: with its audio (fileId) or its transcript alone (audioOmitted). */
  save(entry: RecordingOutboxEntry): Promise<void>;
};

/** Recordings older than this are dropped, as on mobile. */
export const RECORDING_OUTBOX_MAX_AGE_MS = 14 * 24 * 60 * 60_000;

export function recordingSavePath(sessionId: string) {
  return `/ai/voice/calls/${encodeURIComponent(sessionId)}/recording`;
}

export function buildRecordingSaveBody(
  entry: Pick<RecordingOutboxEntry, "durationSeconds" | "segments" | "speech" | "fileId" | "audioOmitted">,
) {
  return {
    ...(entry.fileId ? { file_id: entry.fileId } : { audio_omitted: entry.audioOmitted }),
    duration_seconds: Math.max(0, Math.round(entry.durationSeconds)),
    segments: entry.segments,
    ...(entry.speech?.length ? { speech: entry.speech } : {}),
  };
}

export class CallRecordingOutbox {
  private queue: Promise<unknown> = Promise.resolve();
  private draining = false;
  private readonly storage: RecordingOutboxStorage;
  private readonly now: () => number;

  constructor(storage: RecordingOutboxStorage, now: () => number = Date.now) {
    this.storage = storage;
    this.now = now;
  }

  /** Serializes storage changes so concurrent updates never lose an entry. */
  private run<T>(task: () => Promise<T>): Promise<T> {
    const next = this.queue.then(task, task);
    this.queue = next.catch(() => undefined);
    return next;
  }

  add(entry: Omit<RecordingOutboxEntry, "savedAt">) {
    return this.run(() => this.storage.put({ ...entry, savedAt: this.now() }));
  }

  entries() {
    return this.run(() => this.storage.list());
  }

  private remove(sessionId: string) {
    return this.run(() => this.storage.remove(sessionId));
  }

  /** Sends every saved recording; returns how many reached the server. */
  async drain(deps: RecordingOutboxDeps): Promise<number> {
    if (this.draining) return 0;
    this.draining = true;
    let sent = 0;
    try {
      for (const entry of await this.entries()) {
        if (this.now() - entry.savedAt > RECORDING_OUTBOX_MAX_AGE_MS) {
          // Out of retries: keep the conversation itself if anything was said.
          if (entry.fileId || hasWords(entry)) {
            await deps
              .save(entry.fileId ? { ...entry, audioOmitted: undefined } : { ...entry, audioOmitted: entry.audioOmitted ?? "upload_failed" })
              .catch(() => undefined);
          }
          await this.remove(entry.sessionId);
          continue;
        }
        try {
          let toSave: RecordingOutboxEntry = entry;
          if (!entry.fileId && !entry.audioOmitted) {
            try {
              const fileId = await deps.upload(entry);
              toSave = { ...entry, fileId };
              await this.run(() => this.storage.put(toSave));
            } catch (error) {
              // A final failure (too large, storage full) would fail forever:
              // keep the transcript instead. Anything else is retried later.
              const reason = audioOmittedReason(error);
              if (!reason) throw error;
              if (!hasWords(entry)) {
                await this.remove(entry.sessionId);
                continue;
              }
              toSave = { ...entry, audioOmitted: reason };
              await this.run(() => this.storage.put(toSave));
            }
          }
          await deps.save(toSave);
          await this.remove(entry.sessionId);
          sent += 1;
        } catch {
          // Kept for the next drain (sign-in, the next call, or the network returning).
        }
      }
    } finally {
      this.draining = false;
    }
    return sent;
  }
}
