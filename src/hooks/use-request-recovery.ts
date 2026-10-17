import { useCallback, useEffect } from "react";
import { toast } from "sonner";

/** Report a request failure once per scope/episode, keeping technical errors out of the page. */
export function useRequestRecovery(scope: string, error: unknown, refresh: () => Promise<unknown>, message: string) {
  const failed = Boolean(error);
  const retry = useCallback(() => {
    void refresh().catch(() => undefined);
  }, [refresh]);
  useEffect(() => {
    if (!failed) return;
    const id = toast.error(message, { id: `request:${scope}`, action: { label: "Retry", onClick: retry } });
    return () => { toast.dismiss(id); };
  }, [failed, scope, retry, message]);
  return retry;
}
