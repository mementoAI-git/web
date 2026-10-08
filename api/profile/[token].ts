import type { IncomingMessage, ServerResponse } from "node:http";

const tokenPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ProfileRequest = IncomingMessage & {
  query?: { token?: string | string[] };
};

// Same-origin HTML, including OG tags, must be delivered before any client JavaScript.
export default async function handler(
  req: ProfileRequest,
  res: ServerResponse,
) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    res.statusCode = 405;
    return res.end("Method not allowed");
  }
  const token = req.query?.token;
  if (typeof token !== "string" || !tokenPattern.test(token)) {
    res.statusCode = 404;
    return res.end("Profile not found");
  }
  const base = process.env.VITE_API_BASE_URL;
  if (!base) {
    res.statusCode = 503;
    return res.end("Profile sharing is temporarily unavailable");
  }
  try {
    const response = await fetch(
      `${base.replace(/\/$/, "")}/public/profiles/${token}`,
      {
        signal: AbortSignal.timeout(8000),
        redirect: "error",
      },
    );
    if (!response.ok) {
      res.statusCode =
        response.status === 404 || response.status === 400 ? 404 : 503;
      return res.end(
        res.statusCode === 404
          ? "Profile not found"
          : "Profile sharing is temporarily unavailable",
      );
    }
    if (!response.headers.get("content-type")?.includes("text/html")) {
      res.statusCode = 503;
      return res.end("Profile sharing is temporarily unavailable");
    }
    for (const name of [
      "Content-Type",
      "Content-Security-Policy",
      "X-Robots-Tag",
    ]) {
      const value = response.headers.get(name);
      if (value) res.setHeader(name, value);
    }
    res.statusCode = 200;
    return res.end(req.method === "HEAD" ? undefined : await response.text());
  } catch {
    res.statusCode = 503;
    return res.end("Profile sharing is temporarily unavailable");
  }
}
