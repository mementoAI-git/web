import { describe, expect, it } from "vitest";
import {
  extractSession,
  normalizeApiError,
  normalizeApiResponse,
} from "./contract-adapter";

const canonicalSession = {
  access_token: "canonical-access",
  refresh_token: "canonical-refresh",
  access_expires_at: "2026-08-28T12:00:00.000Z",
  expires_at: "2026-08-28T12:00:00.000Z",
  refresh_expires_at: "2026-09-27T12:00:00.000Z",
  onboarding_status: "completed",
  user: { id: "user-1", email: "ada@example.com" },
};

describe("contract adapter", () => {
  it("prefers the canonical nested session and retains its complete state", () => {
    const session = extractSession({
      success: true,
      data: {
        access_token: "legacy-access",
        refresh_token: "legacy-refresh",
        expires_at: "legacy-expiry",
        refresh_expires_at: "legacy-refresh-expiry",
        onboarded: false,
        session: canonicalSession,
      },
    });

    expect(session).toMatchObject({
      ...canonicalSession,
      onboarded: true,
    });
  });

  it("continues to parse a legacy auth payload", () => {
    expect(
      extractSession({
        access_token: "legacy-access",
        refresh_token: "legacy-refresh",
        expires_at: "2026-08-28T12:00:00.000Z",
        refresh_expires_at: "2026-09-27T12:00:00.000Z",
        onboarded: false,
        onboarding_status: "in_progress",
      }),
    ).toMatchObject({
      access_token: "legacy-access",
      refresh_token: "legacy-refresh",
      access_expires_at: "2026-08-28T12:00:00.000Z",
      onboarded: false,
    });
  });

  it("normalizes success without discarding the existing domain envelope", () => {
    const payload = { status: 200, message: "OK", data: { docs: [1, 2] } };
    expect(normalizeApiResponse(payload)).toEqual({ ...payload, success: true });
  });

  it("preserves stable and legacy error details", () => {
    expect(
      normalizeApiError(
        {
          status: 422,
          success: false,
          message: "Invalid input",
          code: "validation_failed",
          details: { fields: { email: ["Invalid email"] } },
          errors: [{ field: "email", message: "Invalid email" }],
          request_id: "request-1",
          data: { requires_verification: true },
        },
        422,
      ),
    ).toMatchObject({
      status: 422,
      httpStatus: 422,
      success: false,
      code: "validation_failed",
      details: { fields: { email: ["Invalid email"] } },
      errors: [{ field: "email", message: "Invalid email" }],
      request_id: "request-1",
      data: { requires_verification: true },
    });
  });
});
