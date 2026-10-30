import { beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import { seedAuth } from "@/test/auth-helpers";
import { authService } from "@/utility/auth-service";
import { fetcher, postFetcher } from "./fetcher";

const base = "http://localhost:3000/api";

describe("authentication request recovery", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("returns invalid login credentials without refreshing or redirecting", async () => {
    seedAuth();
    const refresh = vi.spyOn(authService, "refreshAccessToken");
    const redirect = vi.spyOn(authService, "redirectToLoginWithPath").mockImplementation(() => {});
    let authorization: string | null = null;
    server.use(http.post(`${base}/auth/login`, ({ request }) => {
      authorization = request.headers.get("Authorization");
      return HttpResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }));
    await expect(postFetcher("/auth/login", { arg: {} })).rejects.toMatchObject({ httpStatus: 401 });
    expect(refresh).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
    expect(authorization).toBeNull();
  });

  it("clears a rejected saved session before redirecting", async () => {
    seedAuth();
    vi.spyOn(authService, "redirectToLoginWithPath").mockImplementation(() => {});
    server.use(
      http.get(`${base}/users/profile`, () => HttpResponse.json({}, { status: 401 })),
      http.post(`${base}/auth/refresh-token`, () => HttpResponse.json({}, { status: 401 })),
    );
    await expect(fetcher("/users/profile")).rejects.toMatchObject({ httpStatus: 401 });
    expect(authService.getAuthData()).toBeNull();
  });

  it("does not reload or discard the session when refresh is rate limited", async () => {
    seedAuth();
    const redirect = vi.spyOn(authService, "redirectToLoginWithPath").mockImplementation(() => {});
    server.use(
      http.get(`${base}/users/profile`, () => HttpResponse.json({}, { status: 401 })),
      http.post(`${base}/auth/refresh-token`, () => HttpResponse.json({}, { status: 429 })),
    );
    await expect(fetcher("/users/profile")).rejects.toMatchObject({ httpStatus: 429 });
    expect(redirect).not.toHaveBeenCalled();
    expect(authService.getAuthData()).not.toBeNull();
  });
  it("shares one refresh across concurrent requests and retries with the new token", async () => {
    seedAuth();
    let refreshCount = 0;
    let protectedCount = 0;
    server.use(
      http.get(`${base}/users/profile`, ({ request }) => {
        protectedCount += 1;
        return request.headers.get("Authorization") === "Bearer renewed-access"
          ? HttpResponse.json({ success: true, data: { id: "user-1" } })
          : HttpResponse.json({}, { status: 401 });
      }),
      http.post(`${base}/auth/refresh-token`, async () => {
        refreshCount += 1;
        await new Promise((resolve) => setTimeout(resolve, 20));
        return HttpResponse.json({ success: true, data: { session: {
          access_token: "renewed-access", refresh_token: "renewed-refresh",
          access_expires_at: new Date(Date.now() + 3600000).toISOString(),
          refresh_expires_at: new Date(Date.now() + 86400000).toISOString(),
        } } });
      }),
    );
    const responses = await Promise.all([fetcher("/users/profile"), fetcher("/users/profile")]);
    expect(responses.every((response) => response.success)).toBe(true);
    expect(refreshCount).toBe(1);
    expect(protectedCount).toBe(4);
  });

  it("stops after one refresh when even the renewed session is rejected", async () => {
    seedAuth();
    const redirect = vi.spyOn(authService, "redirectToLoginWithPath").mockImplementation(() => {});
    const refresh = vi.spyOn(authService, "refreshAccessToken").mockResolvedValue(seedAuth());
    let requests = 0;
    server.use(http.get(`${base}/users/profile`, () => {
      requests += 1;
      return HttpResponse.json({}, { status: 401 });
    }));
    await expect(fetcher("/users/profile")).rejects.toMatchObject({ httpStatus: 401 });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(requests).toBe(2);
    expect(authService.getAuthData()).toBeNull();
    expect(redirect).toHaveBeenCalledTimes(1);
  });

});
