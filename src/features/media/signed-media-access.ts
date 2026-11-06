import { useCallback, useEffect, useRef, useState } from "react";
import { postFetcher } from "@/api/fetcher";
import { authService } from "@/utility/auth-service";
import type { IResponse } from "@/api/interface";
import type { IFile } from "@/utility/interface";

export type MediaAccessRequester = (
  url: string,
  body: { arg: Record<string, string> },
) => Promise<IResponse<IFile>>;

const defaultRequester: MediaAccessRequester = async (url, body) =>
  (await postFetcher(url, body)) as IResponse<IFile>;

const SAFE_REFRESH_ENDPOINT = /^\/files\/[^/?#]+\/access$/;

export function shouldRefreshSignedMedia(
  attachment: IFile,
  now = Date.now(),
): boolean {
  const expiresAt = attachment.access?.expires_at;
  if (!expiresAt || !attachment.access?.refresh_endpoint) return false;
  const expiry = Date.parse(expiresAt);
  return Number.isFinite(expiry) && expiry <= now + 30_000;
}

export function useSignedMediaAccess(
  attachment: IFile,
  requester: MediaAccessRequester = defaultRequester,
  options: { refreshExpired?: boolean; memoryId?: string } = {},
) {
  const [current, setCurrent] = useState(attachment);
  const attemptedRef = useRef(false);
  const mountedRef = useRef(true);
  const externalKey = `${attachment._id}:${attachment.url}:${attachment.access?.expires_at || ""}`;
  const externalKeyRef = useRef(externalKey);
  const refreshExpired = options.refreshExpired !== false;
  const memoryId = options.memoryId;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (externalKeyRef.current === externalKey) return;
    externalKeyRef.current = externalKey;
    attemptedRef.current = false;
    setCurrent(attachment);
  }, [attachment, externalKey]);

  const refreshOnce = useCallback(async () => {
    const refreshEndpoint = current.access?.refresh_endpoint;
    // Refreshing needs a session, and a rejected request would send a reader
    // of a public story to the login page.
    const canRequest =
      requester !== defaultRequester || Boolean(authService.getAuthData());
    if (
      !canRequest ||
      !refreshEndpoint ||
      !SAFE_REFRESH_ENDPOINT.test(refreshEndpoint) ||
      attemptedRef.current
    ) {
      return current;
    }
    attemptedRef.current = true;

    const response = await requester(refreshEndpoint, {
      arg: memoryId ? { memory_id: memoryId } : {},
    });
    const next = response.data;
    if (next?.url && mountedRef.current) setCurrent(next);
    return next?.url ? next : current;
  }, [current, memoryId, requester]);

  useEffect(() => {
    if (refreshExpired && shouldRefreshSignedMedia(current)) {
      void refreshOnce().catch(() => undefined);
    }
  }, [current, refreshExpired, refreshOnce]);

  return { attachment: current, src: current.url, onError: refreshOnce };
}
