"use client";

import { useCallback, useEffect, useRef, useState, type PropsWithChildren } from "react";
import useSWR from "swr";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useRequestRecovery } from "@/hooks/use-request-recovery";
import endpoint from "@/api/endpoint";
import { shouldRetryApiError } from "@/api/retry-policy";
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
  const [validatedToken, setValidatedToken] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<unknown>(null);
  const [attempt, setAttempt] = useState(0);
  const retrySession = useCallback(async () => { setSessionError(null); setAttempt(value => value + 1); }, []);
  const retry = useRequestRecovery("session-refresh", sessionError, retrySession, "Couldn’t restore your session. Check your connection and retry.");
  const userRef = useRef(user);
  userRef.current = user;

  const profile = useSWR(hydrated && auth?.access_token && validatedToken === auth.access_token ? endpoint.profile : null, fetcher<IUser>, {
    shouldRetryOnError: shouldRetryApiError,
  });

  // Cached and deduplicated SWR results do not necessarily fire onSuccess for
  // this subscriber. Hydrate from the result itself after session validation.
  useEffect(() => {
    if (validatedToken !== auth?.access_token || !profile.data?.data) return;
    setUser?.(mergeProfileServerUpdate(userRef.current, profile.data.data));
  }, [profile.data, validatedToken, auth?.access_token, setUser]);

  const retryProfile = useRequestRecovery("session-profile", profile.error, profile.mutate, "Couldn’t load your profile. Please retry.");

  useEffect(() => {
    if (!hydrated) return;
    let active = true;
    setSessionError(null);
    const redirect = () => navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search + location.hash)}`, { replace: true });
    if (isEmpty(auth?.access_token)) {
      redirect();
      return;
    }
    const handleAuth = async () => {
      if (!authService.isAccessTokenExpired(auth!)) {
        setValidatedToken(auth!.access_token);
        return;
      }
      setValidatedToken(null);
      if (authService.isRefreshTokenExpired(auth!)) {
        authService.clearAuth();
        redirect();
        return;
      }
      try {
        const newAuth = await authService.refreshAccessToken();
        if (!active) return;
        setAuth?.(newAuth);
        setValidatedToken(newAuth.access_token);
      } catch (error) {
        if (!active) return;
        if (!authService.getAuthData()) redirect();
        else setSessionError(error);
      }
    };
    void handleAuth();
    return () => { active = false; };
  }, [auth, hydrated, navigate, location.pathname, location.search, location.hash, setAuth, attempt]);

  if (!hydrated || !auth?.access_token) return null;
  if (sessionError) return <div className="flex min-h-[40vh] items-center justify-center"><Button variant="outline" onClick={retry}>Retry session</Button></div>;
  if (validatedToken !== auth.access_token) return <div role="status" className="flex min-h-[40vh] items-center justify-center text-sm text-text-neutral-weak">Restoring session…</div>;

  if (!user) {
    if (profile.error) return <div className="flex min-h-[40vh] items-center justify-center"><Button variant="outline" onClick={retryProfile} disabled={profile.isValidating}>Retry profile</Button></div>;
    return <div role="status" className="flex min-h-[40vh] items-center justify-center text-sm text-text-neutral-weak">Loading your profile…</div>;
  }
  return <>{children}</>;
}
