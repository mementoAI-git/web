import type { FeatureKey } from "./types";

export const UPGRADE_COPY: Record<
  FeatureKey,
  { title: string; description: string }
> = {
  pro_plan: {
    title: "Unlock more with Pro",
    description:
      "Upgrade for advanced features, more storage, voice chat, and better memory context.",
  },
  voice_mode: {
    title: "You’ve used this month’s free voice minutes",
    description:
      "Free includes 90 minutes of voice mode each month. Upgrade to Pro to keep talking with Memento without a limit.",
  },
  supermemory: {
    title: "Supermemory is a Pro feature",
    description:
      "Upgrade for deeper memory context and Supermemory-powered recall.",
  },
  upload_quality: {
    title: "HD uploads are a Pro feature",
    description:
      "Upgrade for original-quality images and video on supported plans.",
  },
  storage: {
    title: "You’ve reached your storage limit",
    description:
      "Upgrade for more space to keep every memory safe.",
  },
  time_capsule_window: {
    title: "Longer time capsules need Pro",
    description:
      "Free accounts can schedule up to 6 months ahead. Upgrade to unlock longer windows.",
  },
  beneficiaries: {
    title: "Add more people with Pro",
    description:
      "Free includes up to 2 beneficiaries. Upgrade for unlimited beneficiaries.",
  },
  timed_messages: {
    title: "More timed messages with Pro",
    description:
      "Free includes up to 5 timed messages. Upgrade for higher limits.",
  },
};
