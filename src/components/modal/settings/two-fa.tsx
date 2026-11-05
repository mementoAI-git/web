import Spinner from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { useStore } from "@/hooks/use-store";
import { useModal } from "@/hooks/use-modal";
import { toast } from "sonner";
import useFetcher from "@/hooks/use-fetcher";
import endpoint from "@/api/endpoint";
import { mutate } from "swr";
import { cn } from "@/utility";

export default function TwoFactorAuthenticator() {
  const { push } = useModal();
  const { user, hydrated } = useStore();
  const { trigger: setup2FA, isMutating: enabling } = useFetcher(endpoint.setup2FA, "get");
  const { trigger: disable2FA, isMutating: disabling } = useFetcher(endpoint.disable2FA, "delete");

  const handleSetup2FA = async () => {
    const result = await setup2FA();
    if (result?.success) {
      push?.("setup2fa", result?.data);
    }
  };

  const handleDisable2FA = async () => {
    const result = await disable2FA({});
    if (result?.success) {
      mutate(endpoint.profile);
      toast.success(result?.message);
    }
  };

  const isReady = hydrated && Boolean(user);
  const isEnabled = user?.two_factor?.enabled;

  return (
    <div className="settings-row min-h-9 flex-wrap">
      <div className="flex min-w-0 items-center gap-1.5 text-sm text-text-neutral-strong">
        2-Factor Authentication
        {isReady ? (
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-semibold",
              isEnabled
                ? "bg-fill-success-weak text-text-success-strong"
                : "bg-fill-error-weak text-text-error-strong",
            )}
          >
            {isEnabled ? "On" : "Off"}
          </span>
        ) : null}
      </div>
      {!isReady ? null : isEnabled ? (
        <Button
          type="button"
          variant="ghost"
          className="settings-pill h-9 px-4"
          disabled={disabling}
          onClick={handleDisable2FA}
        >
          Turn off 2FA
          {disabling ? <Spinner loading className="!size-4" /> : null}
        </Button>
      ) : (
        <Button
          type="button"
          variant="ghost"
          className="settings-pill h-9 px-4"
          disabled={enabling}
          onClick={handleSetup2FA}
        >
          Setup 2FA
          {enabling ? <Spinner loading className="!size-4" /> : null}
        </Button>
      )}
    </div>
  );
}
