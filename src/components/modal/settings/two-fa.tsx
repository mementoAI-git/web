import Spinner from "@/components/spinner";
import { useStore } from "@/hooks/use-store";
import { useModal } from "@/hooks/use-modal";
import { toast } from "sonner";
import useFetcher from "@/hooks/use-fetcher";
import endpoint from "@/api/endpoint";
import { mutate } from "swr";
import { SettingsPillButton } from "./settings-action-row";
import { SettingsSectionCard } from "./settings-section-card";

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

  const isEnabled = user?.two_factor?.enabled;

  const statusLabel = !hydrated || !user ? (
    <span className="inline-block h-4 w-32 rounded-full bg-v3-fill-weaker" aria-hidden />
  ) : isEnabled ? (
    "Authenticator app is set up."
  ) : (
    "Authenticator app is not set up yet."
  );

  return (
    <SettingsSectionCard
      title="Two-factor authentication"
      description={statusLabel}
      headerAction={
        !hydrated || !user ? null : isEnabled ? (
          <SettingsPillButton
            type="button"
            variant="default"
            disabled={disabling}
            onClick={handleDisable2FA}
            className="border-danger/40 text-danger hover:bg-danger/5"
          >
            <span>Turn off 2FA</span>
            {disabling ? <Spinner loading className="!size-4 text-danger" /> : null}
          </SettingsPillButton>
        ) : (
          <SettingsPillButton type="button" variant="default" disabled={enabling} onClick={handleSetup2FA}>
            <span>Set up</span>
            {enabling ? <Spinner loading className="!size-4 text-v3-text-strong" /> : null}
          </SettingsPillButton>
        )
      }
    />
  );
}
