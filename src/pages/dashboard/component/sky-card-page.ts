/** Limit sky card styling to the screens opted into the borderless treatment. */
export function isSkyCardPage(pathname: string): boolean {
  // Beneficiary settings retain their current card treatment.
  if (pathname === "/settings/beneficiary" || pathname.startsWith("/settings/beneficiary/")) return false;
  return pathname === "/" || ["/overview", "/chat", "/explore", "/insights", "/settings", "/pricing"].some(
    (page) => pathname === page || pathname.startsWith(`${page}/`),
  );
}
