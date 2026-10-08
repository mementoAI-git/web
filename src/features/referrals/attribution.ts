const KEY = "memento:referral";
const MAX_AGE = 30 * 24 * 60 * 60 * 1000;
const CODE = /^[a-f0-9]{32}$/;

export function captureReferral(search = window.location.search) {
  const code = new URLSearchParams(search).get("ref");
  if (!code || !CODE.test(code) || getReferralCode()) return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ code, capturedAt: Date.now() }));
  } catch {
    /* Registration remains usable without storage. */
  }
}

export function getReferralCode(): string | undefined {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (
      value &&
      typeof value.code === "string" &&
      CODE.test(value.code) &&
      typeof value.capturedAt === "number" &&
      Date.now() - value.capturedAt >= 0 &&
      Date.now() - value.capturedAt < MAX_AGE
    )
      return value.code;
    localStorage.removeItem(KEY);
  } catch {
    /* Ignore unavailable or invalid storage. */
  }
}

export function clearReferral() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* Storage may be unavailable. */
  }
}
