import assert from "node:assert/strict";
import { test } from "node:test";

import { forwardToLocalAgent } from "../apps/web/app/local-agent-proxy.ts";

void test("built preview forwards agent requests to the loopback runtime with cookies and body", async () => {
  const request = new Request("http://localhost:5180/eve/v1/session?test=1", {
    method: "POST",
    headers: {
      cookie: "eve_access=synthetic-test-cookie",
      "sec-fetch-site": "same-origin",
    },
    body: JSON.stringify({ message: "Hello" }),
  });
  const response = await forwardToLocalAgent(request, async (forwarded) => {
    assert.equal(forwarded.url, "http://127.0.0.1:5181/eve/v1/session?test=1");
    assert.equal(
      forwarded.headers.get("cookie"),
      "eve_access=synthetic-test-cookie"
    );
    assert.equal(await forwarded.text(), JSON.stringify({ message: "Hello" }));
    return Response.json({ ok: true }, { status: 202 });
  });
  assert.equal(response.status, 202);
});

void test("unavailable local runtime returns a useful redacted failure", async () => {
  const response = await forwardToLocalAgent(
    new Request("http://localhost:5180/eve/v1/session"),
    async () => {
      throw new Error("private upstream detail");
    }
  );
  assert.equal(response.status, 503);
  const body = await response.text();
  assert.equal(body.includes("private upstream detail"), false);
});
