import type { ApiError } from "@/api/interface";

/** A rejected link is different from a network, rate-limit, or server failure. */
export function isUnavailablePublicLink(error: unknown): boolean {
  const failure = error as ApiError | undefined;
  return [400, 401, 403, 404, 410, 422].includes(failure?.httpStatus ?? failure?.status ?? 0);
}
