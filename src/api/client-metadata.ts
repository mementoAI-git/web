const MAX_HEADER_LENGTH = 128;
const PRINTABLE_ASCII = /^[\x20-\x7e]+$/;

function bounded(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim();
  if (
    !normalized ||
    normalized.length > MAX_HEADER_LENGTH ||
    !PRINTABLE_ASCII.test(normalized)
  ) {
    return fallback;
  }
  return normalized;
}

export function getMementoClientHeaders(): Record<string, string> {
  return {
    "X-Memento-Client": "web",
    "X-Memento-Version": bounded(import.meta.env.VITE_APP_VERSION, "0.0.0"),
    "X-Memento-Build": bounded(import.meta.env.VITE_APP_BUILD, "dev"),
  };
}
