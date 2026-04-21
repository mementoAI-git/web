import type { FeatureKey } from "./types";

function storageKey(feature: FeatureKey) {
  return `memento_upgrade_dismissed_${feature}`;
}

export function dismissUpgradeGate(feature: FeatureKey) {
  try {
    sessionStorage.setItem(storageKey(feature), "1");
  } catch {
    /* ignore */
  }
}

export function isUpgradeGateDismissed(feature: FeatureKey): boolean {
  try {
    return sessionStorage.getItem(storageKey(feature)) === "1";
  } catch {
    return false;
  }
}
