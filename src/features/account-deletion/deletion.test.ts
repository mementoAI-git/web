import { describe, expect, it } from "vitest";
import { buildDeleteAccountPayload, deletionReasonLabel, isDeletionConfirmed, maskEmail } from "./deletion";

describe("account deletion", () => {
  it("requires the exact confirmation word", () => {
    expect(isDeletionConfirmed("DELETE")).toBe(true);
    expect(isDeletionConfirmed(" DELETE ")).toBe(true);
    expect(isDeletionConfirmed("delete")).toBe(false);
  });

  it("labels the chosen reason, defaulting to No reason", () => {
    expect(deletionReasonLabel(null)).toBe("No reason");
    expect(deletionReasonLabel("taking-break")).toBe("I’m taking a break");
  });

  it("masks the email like the design", () => {
    expect(maskEmail("grootxyz@gmail.com")).toBe("groot***gmail.com");
    expect(maskEmail(undefined)).toBe("");
  });

  it("sends details only for Something else", () => {
    expect(buildDeleteAccountPayload({ reason: "other", details: " too slow ", exportData: true }))
      .toEqual({ reason: "other", details: "too slow", export_data: true });
    expect(buildDeleteAccountPayload({ reason: "taking-break", details: "x", exportData: false }))
      .toEqual({ reason: "taking-break", export_data: false });
  });
});
