import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import Axios from "axios";
import dayjs from "dayjs";
import { authService } from "@/utility/auth-service";
import { storageKeys } from "@/utility/constant";
import type { IAuth } from "@/utility/interface";

const mockAuth: IAuth = {
  access_token: "access",
  refresh_token: "refresh",
  expires_at: "",
  refresh_expires_at: "",
};

describe("AuthService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe("isAccessTokenExpired", () => {
    it("returns true when expires_at is missing", () => {
      const auth = { ...mockAuth, expires_at: "" };
      delete (auth as Partial<IAuth>).expires_at;
      expect(authService.isAccessTokenExpired(auth as IAuth)).toBe(true);
    });

    it("returns true when expires_at is within 5 minutes from now", () => {
      const auth = {
        ...mockAuth,
        expires_at: dayjs().add(2, "minutes").toISOString(),
      };
      expect(authService.isAccessTokenExpired(auth)).toBe(true);
    });

    it("returns true when expires_at is in the past", () => {
      const auth = {
        ...mockAuth,
        expires_at: dayjs().subtract(1, "minute").toISOString(),
      };
      expect(authService.isAccessTokenExpired(auth)).toBe(true);
    });

    it("returns false when expires_at is more than 5 minutes in the future", () => {
      const auth = {
        ...mockAuth,
        expires_at: dayjs().add(10, "minutes").toISOString(),
      };
      expect(authService.isAccessTokenExpired(auth)).toBe(false);
    });
  });

  describe("isRefreshTokenExpired", () => {
    it("returns true when refresh_expires_at is missing", () => {
      const auth = { ...mockAuth };
      delete (auth as Partial<IAuth>).refresh_expires_at;
      expect(authService.isRefreshTokenExpired(auth as IAuth)).toBe(true);
    });

    it("returns true when refresh_expires_at is in the past", () => {
      const auth = {
        ...mockAuth,
        refresh_expires_at: dayjs().subtract(1, "minute").toISOString(),
      };
      expect(authService.isRefreshTokenExpired(auth)).toBe(true);
    });

    it("returns false when refresh_expires_at is in the future", () => {
      const auth = {
        ...mockAuth,
        refresh_expires_at: dayjs().add(1, "hour").toISOString(),
      };
      expect(authService.isRefreshTokenExpired(auth)).toBe(false);
    });
  });

  describe("getCurrentPath", () => {
    const originalLocation = window.location;

    beforeEach(() => {
      Object.defineProperty(window, "location", {
        value: { pathname: "/dashboard", search: "" },
        writable: true,
      });
    });

    afterEach(() => {
      Object.defineProperty(window, "location", {
        value: originalLocation,
        writable: true,
      });
    });

    it("returns pathname + search when not on /login", () => {
      (window.location as { pathname: string; search: string }).pathname =
        "/dashboard";
      (window.location as { pathname: string; search: string }).search = "";
      expect(authService.getCurrentPath()).toBe("/dashboard");
    });

    it("returns pathname with search params when not on /login", () => {
      (window.location as { pathname: string; search: string }).pathname =
        "/dashboard";
      (window.location as { pathname: string; search: string }).search =
        "?tab=stories";
      expect(authService.getCurrentPath()).toBe("/dashboard?tab=stories");
    });

    it("returns empty string when on /login page", () => {
      (window.location as { pathname: string; search: string }).pathname =
        "/login";
      (window.location as { pathname: string; search: string }).search = "";
      expect(authService.getCurrentPath()).toBe("");
    });
  });

  describe("getAuthData", () => {
    it("returns null when localStorage has no auth", () => {
      expect(authService.getAuthData()).toBe(null);
    });

    it("returns parsed IAuth when localStorage has valid JSON", () => {
      const auth = { ...mockAuth };
      localStorage.setItem(storageKeys.auth, JSON.stringify(auth));
      expect(authService.getAuthData()).toEqual(auth);
    });

    it("returns null instead of crashing on corrupt persisted data", () => {
      localStorage.setItem(storageKeys.auth, "not-json");
      expect(authService.getAuthData()).toBe(null);
    });
  });

  describe("refreshAccessToken", () => {
    it("atomically stores the canonical nested session", async () => {
      const existing = {
        ...mockAuth,
        expires_at: dayjs().subtract(1, "minute").toISOString(),
        refresh_expires_at: dayjs().add(1, "hour").toISOString(),
      };
      localStorage.setItem(storageKeys.auth, JSON.stringify(existing));
      vi.spyOn(Axios, "post").mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            access_token: "stale-legacy-access",
            session: {
              access_token: "new-access",
              refresh_token: "new-refresh",
              access_expires_at: dayjs().add(1, "hour").toISOString(),
              expires_at: dayjs().add(1, "hour").toISOString(),
              refresh_expires_at: dayjs().add(30, "days").toISOString(),
              onboarding_status: "completed",
              user: { id: "user-1" },
            },
          },
        },
      });

      const refreshed = await authService.refreshAccessToken();

      expect(refreshed).toMatchObject({
        access_token: "new-access",
        refresh_token: "new-refresh",
        onboarded: true,
        user: { id: "user-1" },
      });
      expect(authService.getAuthData()).toEqual(refreshed);
    });
  });

  describe("setAuthData", () => {
    it("writes auth to localStorage as JSON", () => {
      const auth = { ...mockAuth };
      authService.setAuthData(auth);
      expect(localStorage.getItem(storageKeys.auth)).toBe(JSON.stringify(auth));
    });
  });

  describe("clearAuth", () => {
    it("removes memento:auth from localStorage", () => {
      localStorage.setItem(storageKeys.auth, JSON.stringify(mockAuth));
      authService.clearAuth();
      expect(localStorage.getItem(storageKeys.auth)).toBe(null);
    });
  });
});
