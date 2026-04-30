import { describe, expect, it, vi } from "vitest";
import { isFeatureFlagAdminUser } from "./feature-flags";

describe("feature-flags admin allowlist", () => {
  it("returns true when email is listed", () => {
    vi.stubEnv("VITE_FEATURE_FLAGS_ADMIN_EMAILS", "admin@example.com,owner@example.com");
    expect(isFeatureFlagAdminUser("owner@example.com")).toBe(true);
  });

  it("returns false when email is not listed", () => {
    vi.stubEnv("VITE_FEATURE_FLAGS_ADMIN_EMAILS", "admin@example.com");
    expect(isFeatureFlagAdminUser("random@example.com")).toBe(false);
  });
});
