import { storageKeys } from "@/utility/constant";
import { mockAuth } from "./fixtures";
import type { IAuth } from "@/utility/interface";

export function seedAuth(overrides?: Partial<IAuth>) {
  const auth = { ...mockAuth, ...overrides };
  localStorage.setItem(storageKeys.auth, JSON.stringify(auth));
  return auth;
}

export function clearAuth() {
  localStorage.removeItem(storageKeys.auth);
}

export function getStoredAuth(): IAuth | null {
  const raw = localStorage.getItem(storageKeys.auth);
  return raw ? JSON.parse(raw) : null;
}
