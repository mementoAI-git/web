/** URLSearchParams already decodes the value. Keep navigation inside the application. */
export function authRedirect(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || (value.includes("\\") || [...value].some(char => char.charCodeAt(0) <= 32))) return "/overview";
  const path = value.split(/[?#]/)[0];
  if (["/login", "/register", "/two-factor", "/verify-email"].includes(path)) return "/overview";
  return value;
}
