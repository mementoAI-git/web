import type { IResponse } from "./interface";
import type { IPagination } from "@/utility/interface";

type NormalizedResponse<T> = IResponse<T> & { data: T };

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function responseParts(payload: unknown) {
  const source = record(payload);
  return {
    source,
    domain:
      source && Object.prototype.hasOwnProperty.call(source, "data")
        ? source.data
        : payload,
  };
}

function unwrapLegacyEnvelope(value: unknown): unknown {
  const nested = record(value);
  if (!nested || !Object.prototype.hasOwnProperty.call(nested, "data")) {
    return value;
  }

  const envelopeKeys = new Set(["data", "message", "success", "status", "meta"]);
  return Object.keys(nested).every((key) => envelopeKeys.has(key))
    ? nested.data
    : value;
}

function withData<T>(payload: unknown, data: T): NormalizedResponse<T> {
  const source = record(payload);
  return {
    ...(source || {}),
    message: typeof source?.message === "string" ? source.message : "",
    success: typeof source?.success === "boolean" ? source.success : true,
    data,
  };
}

export function normalizeEntityResponse<T>(payload: unknown): NormalizedResponse<T | null> {
  const { domain } = responseParts(payload);
  const value = unwrapLegacyEnvelope(domain);
  return withData(payload, (value ?? null) as T | null);
}

export function normalizeCollectionResponse<T>(payload: unknown): NormalizedResponse<T[]> {
  const { domain } = responseParts(payload);
  const value = unwrapLegacyEnvelope(domain);
  const paginated = record(value);
  const data =
    Array.isArray(value) ? value
    : Array.isArray(paginated?.docs) ? paginated.docs
    : [];
  return withData(payload, data as T[]);
}

function number(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function normalizePaginatedResponse<T>(
  payload: unknown,
  defaults: { page?: number; limit?: number } = {},
): NormalizedResponse<IPagination<T>> {
  const { domain } = responseParts(payload);
  const value = unwrapLegacyEnvelope(domain);
  const source = record(value);
  const docs = (Array.isArray(value) ? value : source?.docs) as unknown;
  const safeDocs = Array.isArray(docs) ? (docs as T[]) : [];
  const page = number(source?.page, defaults.page ?? 1);
  const limit = number(source?.limit, defaults.limit ?? Math.max(safeDocs.length, 1));
  const totalDocs = number(source?.totalDocs, safeDocs.length);
  const totalPages = number(source?.totalPages, Math.max(1, Math.ceil(totalDocs / limit)));
  const hasNextPage =
    typeof source?.hasNextPage === "boolean" ? source.hasNextPage : page < totalPages;
  const hasPrevPage =
    typeof source?.hasPrevPage === "boolean" ? source.hasPrevPage : page > 1;

  return withData(payload, {
    docs: safeDocs,
    page,
    limit,
    totalDocs,
    totalPages,
    hasNextPage,
    hasPrevPage,
    nextPage: typeof source?.nextPage === "number" ? source.nextPage : hasNextPage ? page + 1 : null,
    prevPage: typeof source?.prevPage === "number" ? source.prevPage : hasPrevPage ? page - 1 : null,
    pagingCounter: number(source?.pagingCounter, totalDocs === 0 ? 0 : (page - 1) * limit + 1),
  });
}
