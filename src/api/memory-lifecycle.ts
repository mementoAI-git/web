import { mutate } from "swr";
import endpoint from "./endpoint";
import { del, post } from "./mutations";
import { resolvePath } from "@/utility";
import type { IMemory } from "@/utility/interface";
import type { ApiResponse } from "./interface";

export const MEMORY_CHANGED_EVENT = "memento:memory-changed";
export const MEMORY_UNDO_DURATION = 10_000;

export function isMemoryCacheKey(key: unknown): boolean {
  if (typeof key !== "string") return false;
  const path = key.replace(/^\$inf\$/, "");
  return [endpoint.memories, endpoint.conversations, endpoint.userStats].some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(`${prefix}?`),
  );
}

function confirmedMemory(response: ApiResponse<IMemory>): IMemory {
  if (response.success === false || !response.data?._id) {
    throw new Error(response.message || "The memory could not be updated. Please try again.");
  }
  // Refresh all pages, Deleted, Bookmarked, grid/infinite caches, search and stats.
  // A refresh failure must not turn a committed write into an apparent failure.
  void mutate(isMemoryCacheKey).catch(() => undefined);
  // SWR's predicate mutation deliberately skips infinite aggregate keys. Notify
  // mounted grids to call their bound mutate(), which refreshes every page.
  window.dispatchEvent(new Event(MEMORY_CHANGED_EVENT));
  return response.data;
}

export async function deleteMemory(id: string, permanently = false): Promise<IMemory> {
  return confirmedMemory(await del<IMemory>(resolvePath(endpoint.memory, { id }), {
    data: { delete_permanently: permanently },
  }));
}

// Undo and the Deleted menu share the same request and invalidation path.
const restorations = new Map<string, Promise<IMemory>>();
export function restoreMemory(id: string): Promise<IMemory> {
  const pending = restorations.get(id);
  if (pending) return pending;
  const request = post<IMemory>(resolvePath(endpoint.restoreMemory, { id }))
    .then(confirmedMemory)
    .finally(() => restorations.delete(id));
  restorations.set(id, request);
  return request;
}

export function memoryActionError(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return fallback;
}
