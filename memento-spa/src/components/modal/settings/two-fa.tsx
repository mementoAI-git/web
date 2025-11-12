import Spinner from "@/components/spinner";
import { useStore } from "@/hooks/use-store";
import { useModal } from "@/hooks/use-modal";
import { toast } from "sonner";
import useFetcher from "@/hooks/use-fetcher";
import endpoint from "@/api/endpoint";
import { mutate } from "swr";

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

  return (
    <div className="space-y-2 font-inter text-[#000933A6]">
      <div className="flex items-center gap-3">
        <span className="font-inter text-sm font-bold text-gray-950/90">2FA Verification</span>
        {hydrated && user ? (
          <span
            className={`inline-block rounded-full border px-2.5 py-0.5 text-sm first-letter:capitalize ${
              isEnabled
                ? "border-[#067A5733] bg-[#ECFDF3] text-[#12B76A]"
                : "border-[#FECDCA] bg-[#FEF3F2] text-[#C73A3A]"
            }`}
          >
            {isEnabled ? "2FA activated" : "Not activated"}
          </span>
        ) : (
          <div className="h-4.5 w-30 rounded-full bg-gray-200" />
        )}
      </div>
      <span className="inline-block font-inter text-base text-gray-950/70">
        An extra layer to boost your Memento account security. A verification code will be required in addition to your
        password each time you sign in.
      </span>
      {isEnabled ? (
        <button
          type="button"
          onClick={handleDisable2FA}
          disabled={disabling}
          className="flex min-w-32.5 items-center justify-center gap-1 rounded-lg border border-[#F04438] px-3 py-1 text-sm font-semibold text-[#F04438] shadow-md"
        >
          <span className="mr-1 inline-block">Disable 2FA</span>
          <Spinner loading={disabling} className="!size-3 !text-[#C73A3A]" />
        </button>
      ) : (
        <button
          type="button"
          onClick={handleSetup2FA}
          disabled={enabling}
          className="flex max-w-32.5 items-center justify-center gap-1 rounded-full bg-gray-950 px-5 py-2.5 text-sm font-semibold text-white shadow-md"
        >
          <span className="mr-1 inline-block">Setup 2FA</span>
          <Spinner loading={enabling} className="!size-3 !text-primary" />
        </button>
      )}
    </div>
  );
}

