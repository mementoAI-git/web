"use client";

import Axios from "axios";
import { IAuth } from "@/utility/interface";
import { storageKeys } from "@/utility/constant";
import endpoint from "@/api/endpoint";
import dayjs from "dayjs";

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;

class AuthService {
  private refreshPromise: Promise<IAuth> | null = null;

  /**
   * Check if the access token is expired or will expire soon (within 5 minutes)
   */
  isAccessTokenExpired(auth: IAuth): boolean {
    if (!auth?.expires_at) return true;
    return dayjs().add(5, 'minutes').isAfter(dayjs(auth.expires_at));
  }

  /**
   * Check if the refresh token is expired
   */
  isRefreshTokenExpired(auth: IAuth): boolean {
    if (!auth?.refresh_expires_at) return true;
    return dayjs().isAfter(dayjs(auth.refresh_expires_at));
  }

  /**
   * Get the current path with query parameters
   */
  getCurrentPath(): string {
    if (typeof window !== 'undefined') {
      return window.location.pathname + window.location.search;
    }
    return '';
  }

  /**
   * Redirect to login with current path as redirect parameter
   */
  redirectToLoginWithPath(): void {
    if (typeof window !== 'undefined') {
      const currentPath = this.getCurrentPath();
      const redirectParam = currentPath ? `?redirect=${encodeURIComponent(currentPath)}` : '';
      window.location.href = `/login${redirectParam}`;
    }
  }

  /**
   * Refresh the access token using the refresh token
   */
  async refreshAccessToken(): Promise<IAuth> {
    // Prevent multiple simultaneous refresh requests
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
      throw new Error('No authentication data found');
    }

    const authData: IAuth = JSON.parse(auth);

    if (this.isRefreshTokenExpired(authData)) {
      // Refresh token is expired, user needs to login again
      this.redirectToLoginWithPath();
      throw new Error('Refresh token expired');
    }

    try {
      const response = await Axios.post(`${baseURL}${endpoint.refreshToken}`, {
        refresh_token: authData.refresh_token
      });

      if (response.data?.success && response.data?.data) {
        const newAuthData: IAuth = response.data.data;

        // Update localStorage with new tokens
        localStorage.setItem(storageKeys.auth, JSON.stringify(newAuthData));

        return newAuthData;
      } else {
        throw new Error('Failed to refresh token');
      }
    } catch (error) {
      // If refresh fails, redirect to login with current path
      this.redirectToLoginWithPath();
      throw error;
    }
  }

  /**
   * Clear authentication data from localStorage
   */
  clearAuth(): void {
    localStorage.removeItem(storageKeys.auth);
  }

  /**
   * Logout user by calling the logout API
   */
  async logout(): Promise<void> {
    try {
      const auth = localStorage.getItem(storageKeys.auth);

      if (auth) {
        const authData: IAuth = JSON.parse(auth);

        await Axios.delete(`${baseURL}${endpoint.logout}`, {
          headers: {
            'Authorization': `Bearer ${authData.access_token}`
          }
        });
      }
    } catch (error) {
      // Even if logout API fails, we should clear local auth
      console.warn('Logout API call failed:', error);
    } finally {
      this.clearAuth();
    }
  }

  /**
   * Get current auth data from localStorage
   */
  getAuthData(): IAuth | null {
    const auth = localStorage.getItem(storageKeys.auth);
    return auth ? JSON.parse(auth) : null;
  }

  /**
   * Set auth data in localStorage
   */
  setAuthData(authData: IAuth): void {
    localStorage.setItem(storageKeys.auth, JSON.stringify(authData));
  }
}

export const authService = new AuthService();