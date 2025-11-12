"use client";

import { useEffect, useState, type PropsWithChildren } from "react";
import useSWR, { mutate } from "swr";
import { useNavigate, useLocation } from "react-router-dom";
import endpoint from "@/api/endpoint";
import { fetcher } from "@/api/fetcher";
import { useStore } from "@/hooks/use-store";
import { isEmpty } from "@/utility";
import { authService } from "@/utility/auth-service";

export default function AuthCheck({ children }: PropsWithChildren) {
  const navigate = useNavigate();
  const location = useLocation();
  const { auth, hydrated, setUser, setAuth } = useStore();
  const [loading, setLoading] = useState(true);

  useSWR(endpoint.profile, fetcher, {
    onSuccess(data) {
      if (data?.data) {
        setUser?.(data.data);
      }
    },
  });

  useEffect(() => {
    if (!hydrated) return;

    if (isEmpty(auth?.access_token)) {
      navigate("/login");
      return;
    }

    const handleAuth = async () => {
      if (authService.isAccessTokenExpired(auth!)) {
        if (authService.isRefreshTokenExpired(auth!)) {
          const redirectParam = encodeURIComponent(location.pathname + location.search);
          navigate(`/login?redirect=${redirectParam}`);
          return;
        }
        try {
          const newAuth = await authService.refreshAccessToken();
          setAuth?.(newAuth);
          await mutate(endpoint.profile);
          setLoading(false);
        } catch {
          const redirectParam = encodeURIComponent(location.pathname + location.search);
          navigate(`/login?redirect=${redirectParam}`);
        }
        return;
      }
      setLoading(false);
    };

    handleAuth();
  }, [auth, hydrated, navigate, location.pathname, location.search, setAuth]);

  if (!hydrated || loading) {
    return null;
  }

  return <>{children}</>;
}

