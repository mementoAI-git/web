import type { IResponse } from "./interface";
import type { IAuth } from "@/utility/interface";

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value ? value : undefined;
}

export function normalizeApiResponse<T = unknown>(payload: unknown): IResponse<T> {
  const source = record(payload) || {};
  return {
    ...source,
    message: text(source.message) || "",
    success: typeof source.success === "boolean" ? source.success : true,
  } as IResponse<T>;
}

export function extractSession(payload: unknown): IAuth | null {
  const outer = record(payload);
  const domain = record(outer?.data) || outer;
  const nestedSession = record(domain?.session);
  const canonical = nestedSession || domain;
  if (!canonical) return null;

  const accessToken = text(canonical.access_token);
  const refreshToken = text(canonical.refresh_token);
  const accessExpiresAt =
    text(canonical.access_expires_at) || text(canonical.expires_at);
  const refreshExpiresAt = text(canonical.refresh_expires_at);
  if (!accessToken || !refreshToken || !accessExpiresAt || !refreshExpiresAt) {
    return null;
  }

  const onboardingStatus =
    text(canonical.onboarding_status) ||
    text(domain?.onboarding_status) ||
    "never";
  const onboarded =
    typeof canonical.onboarded === "boolean"
      ? canonical.onboarded
      : nestedSession
        ? onboardingStatus === "completed"
        : typeof domain?.onboarded === "boolean"
        ? domain.onboarded
        : onboardingStatus === "completed";

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    access_expires_at: accessExpiresAt,
    expires_at: text(canonical.expires_at) || accessExpiresAt,
    refresh_expires_at: refreshExpiresAt,
    onboarding_status: onboardingStatus,
    onboarded,
    user: record(canonical.user) || undefined,
  };
}

export function normalizeApiError(
  payload: unknown,
  httpStatus?: number,
  fallbackMessage = "Something went wrong",
) {
  const source = record(payload) || {};
  const status =
    typeof source.status === "number" ? source.status : httpStatus;
  return {
    ...source,
    message: text(source.message) || fallbackMessage,
    success: false as const,
    status,
    httpStatus: httpStatus ?? status,
  };
}
