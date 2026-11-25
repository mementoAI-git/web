/**
 * Forwards built-preview traffic to its separate loopback agent process.
 * @param request - Incoming agent or workflow callback request.
 * @param send - HTTP transport, overridden only by the transport regression test.
 * @returns The streamed upstream response or a redacted runtime-unavailable error.
 */
export async function forwardToLocalAgent(
  request: Request,
  send: (request: Request) => Promise<Response> = fetch
): Promise<Response> {
  const target = new URL(request.url);
  target.protocol = "http:";
  target.hostname = "127.0.0.1";
  target.port = "5181";
  try {
    return await send(new Request(target, request));
  } catch {
    return Response.json(
      {
        ok: false,
        error:
          "The local agent is not running. Start the built agent on localhost:5181, then retry.",
      },
      { status: 503 }
    );
  }
}
