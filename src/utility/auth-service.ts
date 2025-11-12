"use client";

import Axios from "axios";
import type { IAuth } from "@/utility/interface";
import { storageKeys } from "@/utility/constant";
import endpoint from "@/api/endpoint";
import dayjs from "dayjs";

const baseURL = import.meta.env.VITE_API_BASE_URL;

class AuthService {
  private refreshPromise: Promise<IAuth> | null = null;

  isAccessTokenExpired(auth: IAuth): boolean {
    if (!auth?.expires_at) return true;
    return dayjs().add(5, "minutes").isAfter(dayjs(auth.expires_at));
  }

  isRefreshTokenExpired(auth: IAuth): boolean {
    if (!auth?.refresh_expires_at) return true;
    return dayjs().isAfter(dayjs(auth.refresh_expires_at));
  }

  getCurrentPath(): string {
    if (typeof window !== "undefined") {
      if (window.location.pathname === "/login") {
        return "";
      }
      return window.location.pathname + window.location.search;
    }
    return "";
  }

  redirectToLoginWithPath(): void {
    if (typeof window !== "undefined") {
      const currentPath = this.getCurrentPath();
      const redirectParam = currentPath
        ? `?redirect=${encodeURIComponent(currentPath)}`
        : "";
      window.location.href = `/login${redirectParam}`;
    }
  }

  async refreshAccessToken(): Promise<IAuth> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<IAuth> {
    const auth = localStorage.getItem(storageKeys.auth);

    if (!auth) {
      throw new Error("No authentication data found");
    }

    const authData: IAuth = JSON.parse(auth);

    if (this.isRefreshTokenExpired(authData)) {
      this.redirectToLoginWithPath();
      throw new Error("Refresh token expired");
    }

    try {
      const response = await Axios.post(`${baseURL}${endpoint.refreshToken}`, {
        refresh_token: authData.refresh_token,
      });

      if (response.data?.success && response.data?.data) {
        const newAuthData: IAuth = response.data.data;

        localStorage.setItem(
          storageKeys.auth,
          JSON.stringify(newAuthData),
        );

        return newAuthData;
      } else {
        throw new Error("Failed to refresh token");
      }
    } catch (error) {
      this.redirectToLoginWithPath();
      throw error;
    }
  }

  clearAuth(): void {
    localStorage.removeItem(storageKeys.auth);
  }

  async logout(): Promise<void> {
    try {
      const auth = localStorage.getItem(storageKeys.auth);

      if (auth) {
        const authData: IAuth = JSON.parse(auth);

        await Axios.delete(`${baseURL}${endpoint.logout}`, {
          headers: {
            Authorization: `Bearer ${authData.access_token}`,
          },
        });
      }
    } catch (error) {
      console.warn("Logout API call failed:", error);
    } finally {
      this.clearAuth();
    }
  }

  getAuthData(): IAuth | null {
    const auth = localStorage.getItem(storageKeys.auth);
    return auth ? JSON.parse(auth) : null;
  }

  setAuthData(authData: IAuth): void {
    localStorage.setItem(storageKeys.auth, JSON.stringify(authData));
  }
}

export const authService = new AuthService();

