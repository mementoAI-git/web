/** Keep the navbar and app-wide notification strips on the same content edges. */
export function dashboardInset(pathname: string) {
  return pathname === "/stories" || pathname.startsWith("/stories/")
    ? "px-4 sm:px-4"
    : pathname.startsWith("/chat") &&
        !/^\/chat\/[^/]+\/voice$/.test(pathname) &&
        !pathname.startsWith("/chat/reply/") &&
        !pathname.startsWith("/chat/reflection/")
      ? "px-4 sm:px-[33px]"
      : "px-4 sm:px-8";
}
