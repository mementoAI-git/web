import { beforeEach, describe, expect, it, vi } from "vitest";
import { captureReferral, clearReferral, getReferralCode } from "./attribution";

describe("signup referral attribution", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });
  it("persists a valid first invite across navigation and clears after signup", () => {
    captureReferral(`?ref=${"a".repeat(32)}`);
    captureReferral(`?ref=${"b".repeat(32)}`);
    expect(getReferralCode()).toBe("a".repeat(32));
    clearReferral();
    expect(getReferralCode()).toBeUndefined();
  });
  it("rejects invalid and expired invite data", () => {
    captureReferral("?ref=invalid");
    expect(getReferralCode()).toBeUndefined();
    captureReferral(`?ref=${"a".repeat(32)}`);
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 31 * 86400000);
    expect(getReferralCode()).toBeUndefined();
  });
});
