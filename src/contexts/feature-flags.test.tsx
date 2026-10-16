import { describe, expect, it, vi } from "vitest";
import { isFeatureFlagAdminUser } from "./legacy-feature-flags-admin-access";

describe("legacy unmounted feature-flags admin fixtures", () => {
  it("matches the legacy fixture allowlist", () => {
    vi.stubEnv(
      "VITE_FEATURE_FLAGS_ADMIN_EMAILS",
      "admin@example.com,owner@example.com",
    );
    expect(isFeatureFlagAdminUser("owner@example.com")).toBe(true);
  });

  it("returns false when email is not listed", () => {
    vi.stubEnv("VITE_FEATURE_FLAGS_ADMIN_EMAILS", "admin@example.com");
    expect(isFeatureFlagAdminUser("random@example.com")).toBe(false);
  });
});
