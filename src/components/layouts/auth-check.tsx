"use client";

import { useEffect, useRef, useState, type PropsWithChildren } from "react";
import useSWR, { mutate } from "swr";
import { useNavigate, useLocation } from "react-router-dom";
import endpoint from "@/api/endpoint";
import { fetcher } from "@/api/fetcher";
import { useStore } from "@/hooks/use-store";
import { isEmpty } from "@/utility";
import { authService } from "@/utility/auth-service";
import type { IUser } from "@/utility/interface";

/**
 * Shallow merge profile from GET /users/profile without wiping fields the API omits
 * or sends as null/undefined (e.g. after PUT nickname, a sparse payload must not clear nickname).
 */
function mergeProfileServerUpdate(prev: IUser | null, incoming: IUser): IUser {
  if (!prev) return incoming;
  const out: IUser = { ...prev };
  for (const [key, value] of Object.entries(incoming)) {
    if (value !== undefined && value !== null) {
      (out as Record<string, unknown>)[key] = value;
    }
  }
  return out;
}

export default function AuthCheck({ children }: PropsWithChildren) {
  const navigate = useNavigate();
  const location = useLocation();
  const { auth, hydrated, setUser, setAuth, user } = useStore();
  const [loading, setLoading] = useState(true);
  const userRef = useRef(user);
  userRef.current = user;

  useSWR(endpoint.profile, fetcher<IUser>, {
    onSuccess(data) {
      if (data?.data && setUser) {
        setUser(mergeProfileServerUpdate(userRef.current, data.data));
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
