import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
import { handleSubscriptionGateError } from "@/features/pricing/subscription-errors";
import useFetcher from "@/hooks/use-fetcher";
import { useModal } from "@/hooks/use-modal";

/** Scope pending-write protection to these dialogs, including shell Escape/backdrop close. */
export function useGuardedModalFetcher(
  name: string,
  url: string,
  method: Parameters<typeof useFetcher>[1] = "post",
) {
  const request = useFetcher(url, method);
  const { registerCloseGuard } = useModal();
  const pending = useRef(false);
  const [isMutating, setPending] = useState(false);
  useEffect(
    () => registerCloseGuard?.(name, () => !pending.current),
    [name, registerCloseGuard],
  );
  const trigger = async (payload: Parameters<typeof request.trigger>[0]) => {
    if (pending.current || !url) return;
    pending.current = true;
    setPending(true);
    try {
      const result = await request.trigger(payload);
      if (result?.success === false) toast.error(result.message || "Couldn’t complete this action. Please try again.");
      return result;
    } catch (error) {
      // The shared transport already reports the error; preserve subscription recovery.
      handleSubscriptionGateError(error);
    } finally {
      pending.current = false;
      setPending(false);
    }
  };
  return { trigger, isMutating };
}
