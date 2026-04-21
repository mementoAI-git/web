import { describe, expect, it, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";

import endpoint from "./endpoint";
import { fileUploadFetcher } from "./fetcher";
import { server } from "@/test/mocks/server";
import { seedAuth } from "@/test/auth-helpers";

const UPLOAD_URL = `http://localhost:3000/api${endpoint.upload}`;

describe("fileUploadFetcher — subscription gate (402)", () => {
  beforeEach(() => {
    seedAuth(true);
    server.use(
      http.post(UPLOAD_URL, () =>
        HttpResponse.json(
          {
            success: false,
            feature: "storage",
            message: "Storage limit reached",
          },
          { status: 402 },
        ),
      ),
    );
  });

  it("returns subscriptionGate and message when upload is denied", async () => {
    const file = new File(["x"], "photo.png", { type: "image/png" });
    const result = await fileUploadFetcher(endpoint.upload, { arg: { file } });

    expect(result.success).toBe(false);
    expect(result.subscriptionGate).toBe(true);
    expect(result.message).toContain("Storage limit reached");
    expect(result.data).toBeNull();
  });
});
