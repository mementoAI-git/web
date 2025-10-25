"use client"

import endpoint from "@/api/endpoint";
import { fetcher } from "@/api/fetcher";
import { useStore } from "@/hooks/use-store";
import { isEmpty } from "@/utility";
import { authService } from "@/utility/auth-service";
import { useRouter } from "next/navigation";
import { PropsWithChildren, useEffect, useState } from "react";
import useSWR from "swr";

export default function AuthCheck({ children }: PropsWithChildren) {
  const router = useRouter()
  const { auth, hydrated, setUser, setAuth } = useStore()
  const [loading, setLoading] = useState(true);

  useSWR(endpoint.profile, fetcher, {
    onSuccess(data) {
      if (data?.data) {
        setUser(data.data)
      }
    }
  })

  useEffect(() => {
    if (!hydrated) return;

    if (isEmpty(auth?.access_token)) {
      router.push("/login");
      return;
    }

    // Check if access token is expired
    if (authService.isAccessTokenExpired(auth)) {
      // Check if refresh token is still valid
      if (authService.isRefreshTokenExpired(auth)) {
        // Both tokens expired, redirect to login with current path
        authService.redirectToLoginWithPath();
        return;
      } else {
        // Try to refresh the token
        authService.refreshAccessToken()
          .then((newAuthData) => {
            // Update the store with new auth data
            setAuth(newAuthData);
            setLoading(false);
          })
          .catch(() => {
            // Refresh failed, redirect to login with current path
            authService.redirectToLoginWithPath();
          });
        return;
      }
    }

    setLoading(false);
  }, [auth, hydrated, router]);

  if (!hydrated || loading) {
    return null
  }

  return children
}