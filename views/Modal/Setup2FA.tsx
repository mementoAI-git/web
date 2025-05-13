import { ModalCloseBtn } from "@/components/ModalLayout";
import { useModal } from "@/hooks/use-modal";
import * as yup from "yup";
import { Textinput } from "@/components/Form";
import useForm from "@/hooks/use-form";
import useFetcher from "@/hooks/use-fetcher";
import endpoint from "@/api/endpoint";
import { toast } from "sonner";
import Spinner from "@/components/Spinner";
import { mutate } from "swr";

const initial = { token: "" }
const schema = yup.object().shape({
  token: yup
    .string()
    .required("Email is required")
    .length(6, "Invalid email address")
    .trim()
});
export default function Setup2FA({ data }) {
  const { close } = useModal()
  const { trigger, isMutating } = useFetcher(endpoint.verifyTOTP)

  const { values, errors, handleValue, handleChange, handleSubmit } = useForm({
    initial,
    schema,
    async onSubmit(p) {
      const result = await trigger(p)
      if (result?.status) {
        toast.success(result?.message)
        close("setup2fa")
        mutate(endpoint.profile)
      }
    }
  })

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      handleValue("token", text)
    } catch (err) {
      toast.error("Failed to paste")
    }
  };
  return (
    <div className="modal-container !max-w-154.5">
      <ModalCloseBtn onClick={() => close("setup2fa")} />
      <h3 className="text-secondary font-inter font-semibold text-xl">Setup 2FA</h3>
      <div className="space-y-4">
        <div className="font-inter space-y-3">
          <h4 className="font-medium text-secondary leading-6 ">Step 1:</h4>
          <span className="text-[#000933A6] inline-block">Download the 2FA apps</span>
          <ol className="list-decimal list-inside font-medium text-primary">
            <li>Google Authenticator</li>
            <li>Authy.</li>
          </ol>
        </div>
        <div className="font-inter space-y-3">
          <h4 className="font-medium text-secondary leading-6 ">Step 2:</h4>
          <span className="text-[#000933A6] inline-block">Scan the QR code below to pair Memento with your authenticator app. Cannot scan the QR code?
            <span className="text-primary hover:underline cursor-pointer"> Add Secret code manually.</span>
          </span>
          <div className="size-56 rounded-lg border border-[#0011661A]">
            <img src={data.qrcode} alt="qrcode" className="size-full object-cover" />
          </div>
        </div>
        <div className="font-inter space-y-3">
          <h4 className="font-medium text-secondary leading-6 ">Step 3:</h4>
          <span className="text-[#000933A6] inline-block">Copy and paste the 6-digit code from your authenticator app below:</span>
          <Textinput
            name="token"
            value={values.token}
            error={errors.token}
            onChange={handleChange}
            placeholder="673528"
            end={
              <button onClick={handlePaste} type="button" className="text-primary font-semibold font-inter text-sm capitalize cursor-pointer">
                Paste code
              </button>
            }
          />
        </div>
      </div>
      <div className="flex justify-end items-center gap-3 mt-5">
        <button type="button" className="btn-outline">Cancel</button>
        <button onClick={handleSubmit} type="button" className="btn">
          <span>Complete setup</span>
          <Spinner loading={isMutating} className="!size-4" />
        </button>
      </div>
    </div>
  )
}