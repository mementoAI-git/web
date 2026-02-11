import type { ICapsule } from "@/utility/interface";

export type CapsuleStatus = "draft" | "scheduled" | "delivered";

export function getCapsuleStatus(capsule: ICapsule): CapsuleStatus {
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

export const obfuscateEmail = (email: string): string => {
  if (!email || !email.includes("@")) return email;

  const [username, domain] = email.split("@");
  return `${username.slice(0, 2)}***@${domain}`;
};
