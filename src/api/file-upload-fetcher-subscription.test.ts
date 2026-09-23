import { describe, expect, it, beforeEach, vi } from "vitest";

const { mockAxiosPost } = vi.hoisted(() => ({
  mockAxiosPost: vi.fn(),
}));

vi.mock("axios", async () => {
  const actual = await vi.importActual<typeof import("axios")>("axios");
  return {
    default: {
      ...actual.default,
      create: vi.fn(() => ({
        post: mockAxiosPost,
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() },
        },
      })),
    },
    isAxiosError: (err: unknown) => !!err && (err as { isAxiosError?: boolean }).isAxiosError === true,
  };
});

import endpoint from "./endpoint";
import { fileUploadFetcher } from "./fetcher";
import { seedAuth } from "@/test/auth-helpers";

describe("fileUploadFetcher — subscription gate (402)", () => {
  beforeEach(() => {
    seedAuth(true);
    vi.clearAllMocks();
  });

  it("returns subscriptionGate and message when upload is denied", async () => {
    mockAxiosPost.mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 402,
        data: {
          success: false,
          feature: "storage",
          message: "Storage limit reached",
        },
      },
    });

    const file = new File(["x"], "photo.png", { type: "image/png" });
    const result = await fileUploadFetcher(endpoint.upload, { arg: { file } });

    expect(result.success).toBe(false);
    expect(result.subscriptionGate).toBe(true);
    expect(result.message).toContain("Storage limit reached");
    expect(result.data).toBeNull();
  });

  it("treats the deployed storage quota response as an upgrade gate", async () => {
    mockAxiosPost.mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 403,
        data: {
          status: 403,
          success: false,
          code: "storage_quota_exceeded",
          message: "Storage limit reached. Delete some media or upgrade to continue.",
          details: {
            used_bytes: 209715200,
            reserved_bytes: 0,
            limit_bytes: 209715200,
            remaining_bytes: 0,
            requested_bytes: 1024,
            over_limit: false,
          },
          request_id: "request-1",
        },
      },
    });

    const file = new File(["x"], "photo.png", { type: "image/png" });
    const result = await fileUploadFetcher(endpoint.upload, { arg: { file } });

    expect(result).toMatchObject({
      success: false,
      subscriptionGate: true,
      data: null,
    });
    expect(result.message).toContain("Storage limit reached");
  });
});
