import Spinner from "@/components/Spinner";
import { useStore } from "@/hooks/use-store";
import { useModal } from "@/hooks/use-modal";
import { toast } from "sonner";
import useFetcher from "@/hooks/use-fetcher";
import endpoint from "@/api/endpoint";
import { mutate } from "swr";

export default function TwoFactorAuthenticator() {
  const { open } = useModal()
  const { user, hydrated } = useStore()
  const { trigger: setup2FA, isMutating: enabling } = useFetcher(endpoint.setup2FA, "get");
  const { trigger: disable2FA, isMutating: disenabling } = useFetcher(endpoint.disable2FA, "delete");

  const handleSetup2FA = async () => {
    const result = await setup2FA()
    if (result?.success) {
      open("setup2fa", result?.data)
    }
  }

  const handleDisable2FA = async () => {
    const result = await disable2FA("")
    if (result?.success) {
      mutate(endpoint.profile)
      toast.success(result?.message)
    }
  }

  return (
    <div className="text-[#000933A6] font-inter space-y-2">
      <div className="flex items-center gap-3">
        <span className="font-bold">2FA Verification</span>
        {
          (hydrated && user) ?
            <span className={` border rounded-full first-letter:capitalize text-sm ${user?.two_factor?.enabled ? "text-success bg-[#0ACC920D] border-[#067A5733]" : "text-[#C73A3A] border-[#C73A3A24] bg-[#FF4A4A0D]"}  inline-block py-0.5 px-2.5`}>
              {user?.two_factor?.enabled ? "2FA activated" : "Not activated"}
            </span> :
            <div className="bg-gray-200 rounded-full h-4.5 w-30" />
        }
      </div>
      <span className="inline-block">
        An extra layer to boost your Memento account Security. A verification code will be required in addition to your password each time you sign in.
      </span>
      {
        user?.two_factor?.enabled ?
          <button
            onClick={handleDisable2FA}
            disabled={disenabling}
            className="flex items-center gap-1 justify-center border-[#C73A3ACC] shadow-md cursor-pointer border rounded-lg px-3 py-1 text-sm text-[#C73A3A] font-bold min-w-32.5"
          >
            <span className="inline-block mr-1">Disable 2FA</span>
            <Spinner loading={disenabling} className="!text-[#C73A3A] !size-3" />
          </button> :
          <button
            onClick={handleSetup2FA}
            disabled={enabling}
            className="flex items-center gap-1 justify-center border-primary shadow-md cursor-pointer border rounded-lg px-3 py-1 text-sm text-primary font-bold max-w-32.5"
          >
            <span className="inline-block mr-1">Setup 2FA</span>
            <Spinner loading={enabling} className="!text-primary !size-3" />
          </button>
      }
    </div>
  )
}