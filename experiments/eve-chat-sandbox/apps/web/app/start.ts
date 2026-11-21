import { createMiddleware, createStart } from "@tanstack/react-start";

import { forwardToLocalAgent } from "./local-agent-proxy";

/**
 * Redirects requests that reach the web service directly during `vercel dev`
 * to the router host, the only place `/eve/*` routes are served locally.
 */
const vercelDevRouter = createMiddleware({ type: "request" }).server(
  async ({ request, next }) => {
    const { pathname } = new URL(request.url);
    if (
      !import.meta.env.DEV &&
      (pathname.startsWith("/eve/") ||
        pathname.startsWith("/.well-known/workflow/"))
    ) {
      return await forwardToLocalAgent(request);
    }
    const routerHost = process.env.VERCEL_URL;
    if (
      process.env.__VERCEL_DEV_RUNNING === "1" &&
      routerHost !== undefined &&
      routerHost !== "" &&
      request.headers.get("x-forwarded-host") !== routerHost
    ) {
      const target = new URL(request.url);
      target.protocol = "http:";
      target.host = routerHost;
      return Response.redirect(target, 307);
    }
    return await next();
  }
);

/** The TanStack Start instance, with the `vercel dev` routing fix applied to every request. */
export const startInstance = createStart(() => ({
  requestMiddleware: [vercelDevRouter],
}));
