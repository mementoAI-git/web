import type { ICapsule } from "@/utility/interface";

export type CapsuleStatus = "draft" | "scheduled" | "delivered";

export function getCapsuleStatus(capsule: ICapsule): CapsuleStatus {
  const now = new Date();
  const deliveryDate = new Date(capsule.delivery_date);

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

export const isImage = (file) => {
  // Handle string input (file path or URL)
  if (typeof file === "string") {
    const ext = file.split(".").pop()?.toLowerCase();
    return ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "");
  }

  // Handle File object
  if (file?.type?.includes("image") || file?.includes("image")) return true;
  // if (file?.type?.includes("image")) return true;
  const ext = file?.name?.split(".").pop()?.toLowerCase();
  return ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "");
};
