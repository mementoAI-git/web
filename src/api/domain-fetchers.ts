import { fetcher } from "./fetcher";
import {
  normalizeCollectionResponse,
  normalizeEntityResponse,
  normalizePaginatedResponse,
} from "./domain-adapters";

function paginationDefaults(url: string) {
  const parsed = new URL(url, "https://memento.local");
  const page = Number(parsed.searchParams.get("page"));
  const limit = Number(parsed.searchParams.get("limit"));
  return {
    page: Number.isFinite(page) && page > 0 ? page : undefined,
    limit: Number.isFinite(limit) && limit > 0 ? limit : undefined,
  };
}

export async function paginatedResponseFetcher<T>(url: string) {
  return normalizePaginatedResponse<T>(await fetcher(url), paginationDefaults(url));
}

export async function collectionResponseFetcher<T>(url: string) {
  return normalizeCollectionResponse<T>(await fetcher(url));
}

export async function entityResponseFetcher<T>(url: string) {
  return normalizeEntityResponse<T>(await fetcher(url));
}
