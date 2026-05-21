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
});
