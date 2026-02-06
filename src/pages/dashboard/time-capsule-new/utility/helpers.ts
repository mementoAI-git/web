import type { IMemory } from "@/utility/interface";

export type CapsuleStatus = "draft" | "scheduled" | "delivered";

export function getCapsuleStatus(capsule: IMemory): CapsuleStatus {
  const now = new Date();
  const deliveryDate = new Date(capsule.delivery_date);

  // Check if it's a draft (you'll need to add this field to your API)
  // Option 1: If API adds a status/is_draft field
  // if (capsule.is_draft) return 'draft';

  // Option 2: Derive from missing required fields
  if (!capsule.body || !capsule.recipients?.length) return "draft";

  // Check if delivery date has passed
  if (deliveryDate <= now) {
    return "delivered";
  }

  return "scheduled";
}
