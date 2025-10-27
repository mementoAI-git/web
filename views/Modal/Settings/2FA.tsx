import Spinner from "@/components/Spinner";
import { useStore } from "@/hooks/use-store";
import { useModal } from "@/hooks/use-modal";
import { toast } from "sonner";
import useFetcher from "@/hooks/use-fetcher";
import endpoint from "@/api/endpoint";
import { mutate } from "swr";

export default function TwoFactorAuthenticator() {
  const { push } = useModal()
  const { user, hydrated } = useStore()
  const { trigger: setup2FA, isMutating: enabling } = useFetcher(endpoint.setup2FA, "get");
  const { trigger: disable2FA, isMutating: disenabling } = useFetcher(endpoint.disable2FA, "delete");

  const handleSetup2FA = async () => {
    const result = await setup2FA()
    if (result?.success) {
      push("setup2fa", result?.data)
    }
  }

  const handleDisable2FA = async () => {
    const result = await disable2FA({})
    if (result?.success) {
      mutate(endpoint.profile)
      toast.success(result?.message)
    }
  }

  return (
    <div className="text-[#000933A6] font-inter space-y-2">
      <div className="flex items-center gap-3">
        <span className="font-bold text-sm font-inter text-gray-950/90">2FA Verification</span>
        {
          (hydrated && user) ?
            <span className={` border rounded-full first-letter:capitalize text-sm ${user?.two_factor?.enabled ? "text-[#12B76A] bg-[#ECFDF3] border-[#067A5733]" : "text-[#C73A3A] border-[#FECDCA] bg-[#FEF3F2]"}  inline-block py-0.5 px-2.5`}>
              {user?.two_factor?.enabled ? "2FA activated" : "Not activated"}
            </span> :
            <div className="bg-gray-200 rounded-full h-4.5 w-30" />
        }
      </div>
      <span className="inline-block text-base font-inter text-gray-950/70">
        An extra layer to boost your Memento account Security. A verification code will be required in addition to your password each time you sign in.
      </span>
      {
        user?.two_factor?.enabled ?
          <button
            onClick={handleDisable2FA}
            disabled={disenabling}
            className="flex items-center gap-1 justify-center border-[#F04438] shadow-md cursor-pointer border rounded-lg px-3 py-1 text-sm font-inter text-[#F04438] font-semibold min-w-32.5"
          >
            <span className="inline-block mr-1">Disable 2FA</span>
            <Spinner loading={disenabling} className="!text-[#C73A3A] !size-3" />
          </button> :
          <button
            onClick={handleSetup2FA}
            disabled={enabling}
            className="flex items-center gap-1 justify-center border-primary shadow-md cursor-pointer px-5 py-2.5 text-sm text-white font-semibold max-w-32.5 bg-gray-950 rounded-full"
          >
            <span className="inline-block mr-1">Setup 2FA</span>
            <Spinner loading={enabling} className="!text-primary !size-3" />
          </button>
      }
    </div>
  )
}