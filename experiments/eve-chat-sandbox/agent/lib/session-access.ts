/**
 * Checks ownership on session reads, writes and controls.
 * @param request - Incoming channel request.
 * @param principal - Verified browser identity.
 * @param owns - Persistent ownership lookup.
 * @returns Whether this request is authorized.
 */
export async function mayAccessSessionRoute(
  request: Request,
  principal: string,
  owns: (session: string, visitor: string) => Promise<boolean>
): Promise<boolean> {
  const { pathname } = new URL(request.url);
  if (pathname === "/eve/v1/session" || pathname === "/eve/v1/info") {
    return true;
  }
  const match =
    /^\/eve\/v1\/session\/(?<session>[\w-]+)(?:\/(?:stream|cancel|compact|clear|reset))?$/u.exec(
      pathname
    );
  return match !== null && (await owns(match.groups?.session ?? "", principal));
}
