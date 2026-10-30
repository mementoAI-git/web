/** Auth failures and throttling require user action, rather than background retries. */
export function shouldRetryApiError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return true;
  const { httpStatus, status } = error as { httpStatus?: number; status?: number };
  return ![401, 403, 429].includes(httpStatus ?? status ?? 0);
}
