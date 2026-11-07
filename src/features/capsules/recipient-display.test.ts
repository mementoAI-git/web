import { describe, expect, it } from "vitest";
import { getCapsuleDisplayRecipients } from "./recipient-display";

describe("capsule recipient display", () => {
  it("uses snapshots for external recipients and legacy data as a fallback", () => {
    expect(getCapsuleDisplayRecipients({
      recipients: [{ email: "legacy@example.com", first_name: "Legacy" } as never],
      recipient_snapshots: [
        { recipient_id: "one", email: "linked@example.com", display_name: "Linked", delivery_status: "delivered" },
        { recipient_id: "two", email: "external@example.com", delivery_status: "sent" },
      ],
    })).toEqual([
      { email: "linked@example.com", first_name: "Linked" },
      { email: "external@example.com", first_name: "external" },
    ]);

    expect(getCapsuleDisplayRecipients({
      recipients: [{ email: "legacy@example.com", first_name: "Legacy" } as never],
    })[0]).toMatchObject({ first_name: "Legacy" });
  });
});

it("preserves the linked account identity for capsule avatar consistency", () => {
  expect(getCapsuleDisplayRecipients({ recipients: [], recipient_snapshots: [{ recipient_id: "snapshot-1", linked_user_id: "user-123", email: "sam@example.com", display_name: "Sam", delivery_status: "pending" }] })[0]._id).toBe("user-123");
});
