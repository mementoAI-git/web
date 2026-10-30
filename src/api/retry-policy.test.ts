import { describe, expect, it } from "vitest";
import { shouldRetryApiError } from "./retry-policy";

describe("API retry policy", () => {
  it.each([401, 403, 429])("does not automatically retry %s", (status) => {
    expect(shouldRetryApiError({ httpStatus: status })).toBe(false);
    expect(shouldRetryApiError({ status })).toBe(false);
  });
  it("allows bounded retries for temporary server and network failures", () => {
    expect(shouldRetryApiError({ httpStatus: 503 })).toBe(true);
    expect(shouldRetryApiError(new Error("Network error"))).toBe(true);
  });
});
