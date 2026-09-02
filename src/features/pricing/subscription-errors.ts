import { toast } from "sonner";

import type { FeatureKey } from "./types";
import { UPGRADE_COPY } from "./upgrade-copy";

/** Backend subscription and storage quota gate JSON. */
export type SubscriptionGatePayload = {
  feature: FeatureKey | string;
  requiredTier?: string;
  message?: string;
};

const FEATURE_ALIASES: Record<string, FeatureKey> = {
  voice_mode: "voice_mode",
  supermemory: "supermemory",
  upload_quality: "upload_quality",
  storage: "storage",
  time_capsule_window: "time_capsule_window",
  beneficiaries: "beneficiaries",
  timed_messages: "timed_messages",
};

export function normalizeGateFeature(feature: string): FeatureKey {
  return FEATURE_ALIASES[feature] ?? "storage";
}

export function parseSubscriptionGateFromBody(body: unknown): SubscriptionGatePayload | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  const nested = o.data && typeof o.data === "object" ? (o.data as Record<string, unknown>) : null;
  const code = typeof o.code === "string" ? o.code : nested?.code;
  const feature =
    typeof o.feature === "string" ? o.feature
    : typeof nested?.feature === "string" ? nested.feature
    : code === "storage_quota_exceeded" ? "storage"
    : undefined;
  if (typeof feature !== "string") return null;
  return {
    feature: normalizeGateFeature(feature),
    requiredTier:
      typeof o.requiredTier === "string"
        ? o.requiredTier
        : typeof nested?.requiredTier === "string"
          ? nested.requiredTier
          : undefined,
    message:
      typeof o.message === "string"
        ? o.message
        : typeof nested?.message === "string"
          ? nested.message
          : undefined,
  };
}

/** Axios/fetcher throw shape after `handleRequest` augmentation. */
export function parseSubscriptionGateError(err: unknown): SubscriptionGatePayload | null {
  if (!err || typeof err !== "object") return null;
  const o = err as Record<string, unknown>;
  const status = o.httpStatus ?? o.status;
  const code = o.code;
  if (
    status !== 402 &&
    !(status === 403 && code === "storage_quota_exceeded")
  ) {
    return null;
  }
  if (typeof o.feature === "string") {
    return {
      feature: normalizeGateFeature(o.feature),
      requiredTier: typeof o.requiredTier === "string" ? o.requiredTier : undefined,
      message: typeof o.message === "string" ? o.message : undefined,
    };
  }
  return parseSubscriptionGateFromBody(err);
}

export function notifySubscriptionGate(payload: SubscriptionGatePayload) {
  const key = typeof payload.feature === "string" ? normalizeGateFeature(payload.feature) : payload.feature;
  const copy = UPGRADE_COPY[key] ?? UPGRADE_COPY.storage;
  toast.message(copy.title, {
    description: payload.message || copy.description,
    action: {
      label: "Upgrade",
      onClick: () => {
        globalThis.location.href = "/pricing";
      },
    },
  });
}

/** @returns true if a subscription or storage quota gate was handled. */
export function handleSubscriptionGateError(err: unknown): boolean {
  const gate = parseSubscriptionGateError(err);
  if (!gate) return false;
  notifySubscriptionGate(gate);
  return true;
}
