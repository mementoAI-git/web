"use client";

import Axios from "axios";
import type { IAuth } from "@/utility/interface";
import { storageKeys } from "@/utility/constant";
import endpoint from "@/api/endpoint";
import dayjs from "dayjs";
import { extractSession } from "@/api/contract-adapter";
import { getMementoClientHeaders } from "@/api/client-metadata";

const baseURL = import.meta.env.VITE_API_BASE_URL;

export const AUTH_CLEARED_EVENT = "memento:auth-cleared";

class AuthService {
  private sessionVersion = 0;
  private refreshPromise: Promise<IAuth> | null = null;

  private readAuthRaw(): string | null {
    try {
      return localStorage.getItem(storageKeys.auth);
    } catch {
      return null;
    }
  }

  private writeAuthRaw(value: string): void {
    try {
      localStorage.setItem(storageKeys.auth, value);
    } catch {
      // Ignore storage-write failures in restricted contexts.
    }
  }

  private removeAuthRaw(): void {
    try {
      localStorage.removeItem(storageKeys.auth);
    } catch {
      // Ignore storage-clear failures in restricted contexts.
    }
  }

  isAccessTokenExpired(auth: IAuth): boolean {
    const expiresAt = auth?.access_expires_at || auth?.expires_at;
    if (!expiresAt) return true;
    return dayjs().add(5, "minutes").isAfter(dayjs(expiresAt));
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
      return window.location.pathname + window.location.search + (window.location.hash || "");
    }
    return "";
  }

  redirectToLoginWithPath(): void {
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
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
    const authData = this.getAuthData();
    const sessionVersion = this.sessionVersion;

    if (!authData) {
      throw new Error("No authentication data found");
    }

    if (this.isRefreshTokenExpired(authData)) {
      this.clearAuth();
      this.redirectToLoginWithPath();
      throw new Error("Refresh token expired");
    }

    try {
      const response = await Axios.post(`${baseURL}${endpoint.refreshToken}`, {
        refresh_token: authData.refresh_token,
      }, {
        headers: getMementoClientHeaders(),
      });

      if (sessionVersion !== this.sessionVersion) throw new Error("Session changed during refresh");
      const newAuthData = extractSession(response.data);
      if (response.data?.success !== false && newAuthData) {

        this.writeAuthRaw(JSON.stringify(newAuthData));

        return newAuthData;
      } else {
        throw new Error("Failed to refresh token");
      }
    } catch (error) {
      if (sessionVersion !== this.sessionVersion) throw error;
      // Network failures and throttling must not trigger a document reload.
      const status = Axios.isAxiosError(error) ? error.response?.status : undefined;
      if (status === 401 || status === 403 || !Axios.isAxiosError(error)) {
        this.clearAuth();
        this.redirectToLoginWithPath();
      }
      throw error;
    }
  }

  clearAuth(): void {
    this.sessionVersion++;
    this.removeAuthRaw();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(AUTH_CLEARED_EVENT));
    }
  }

  /** Revoke other sessions before the current one; preserve local access if either fails. */
  async logoutAllDevices(): Promise<void> {
    const auth = this.getAuthData();
    if (!auth) throw new Error("Your session is unavailable. Please sign in again.");
    const config = {
      headers: { Authorization: `Bearer ${auth.access_token}`, ...getMementoClientHeaders() },
      data: { refresh_token: auth.refresh_token },
    };
    for (const path of ["/auth/logout/other", endpoint.logout]) {
      const response = await Axios.delete(`${baseURL}${path}`, config);
      if (response.data?.success === false) throw new Error(response.data.message || "Couldn’t log out of all devices.");
    }
    this.clearAuth();
  }

  async logout(): Promise<void> {
    try {
      const auth = this.readAuthRaw();

      if (auth) {
        const authData: IAuth = JSON.parse(auth);

        await Axios.delete(`${baseURL}${endpoint.logout}`, {
          headers: {
            Authorization: `Bearer ${authData.access_token}`,
            ...getMementoClientHeaders(),
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
    const auth = this.readAuthRaw();
    if (!auth) return null;
    try {
      return JSON.parse(auth) as IAuth;
    } catch {
      this.removeAuthRaw();
      return null;
    }
  }

  setAuthData(authData: IAuth): void {
    this.sessionVersion++;
    this.writeAuthRaw(JSON.stringify(authData));
  }
}

export const authService = new AuthService();
