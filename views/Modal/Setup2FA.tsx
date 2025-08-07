import { ModalCloseBtn, ModalWrapper } from "@/components/ModalLayout";
import { useModal } from "@/hooks/use-modal";
import * as yup from "yup";
import { Textinput } from "@/components/Form";
import useForm from "@/hooks/use-form";
import useFetcher from "@/hooks/use-fetcher";
import endpoint from "@/api/endpoint";
import { toast } from "sonner";
import Spinner from "@/components/Spinner";
import { mutate } from "swr";
import { useState } from "react";
import CopyIcon from "@/public/icon/copy.svg";

const initial = { token: "" }
const schema = yup.object().shape({
  token: yup
    .string()
    .required("Token is required")
    .length(6, "Invalid token")
    .trim()
});
export default function Setup2FA({ data, isMobile = false }) {
  const { close } = useModal()
  const { trigger, isMutating } = useFetcher(endpoint.verifyTOTP)
  const [showSecret, setShowSecret] = useState(false)

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

  const handleCopySecret = async () => {
    try {
      await navigator.clipboard.writeText(data.secret);
      toast.success("Secret code copied to clipboard");
    } catch (err) {
      toast.error("Failed to copy secret code");
    }
  };

  // return (
  //   <div className="modal-container !max-w-154.5">
  //     <ModalCloseBtn onClick={() => close("setup2fa")} />
  //     <h3 className="text-secondary font-inter font-semibold text-xl">Setup 2FA</h3>
  //     <div className="space-y-4">
  //       <div className="font-inter space-y-3">
  //         <h4 className="font-medium text-secondary leading-6 ">Step 1:</h4>
  //         <span className="text-[#000933A6] inline-block">Download the 2FA apps</span>
  //         <ol className="list-decimal list-inside font-medium text-primary">
  //           <li>Google Authenticator</li>
  //           <li>Authy.</li>
  //         </ol>
  //       </div>
  //       <div className="font-inter space-y-3">
  //         <h4 className="font-medium text-secondary leading-6 ">Step 2:</h4>
  //         <span className="text-[#000933A6] inline-block">Scan the QR code below to pair Memento with your authenticator app. Cannot scan the QR code?
  //           <span
  //             className="text-primary inline-block ml-1 hover:underline cursor-pointer"
  //             onClick={() => setShowSecret(!showSecret)}
  //           >
  //             {showSecret ? "Show QR code" : "Add Secret code manually"}
  //           </span>
  //         </span>
  //         {!showSecret ? (
  //           <div className="size-56 rounded-lg border border-[#0011661A]">
  //             <img src={data.qrcode} alt="qrcode" className="size-full object-cover" />
  //           </div>
  //         ) : (
  //           <div className="space-y-2 p-4 bg-grey-400 rounded-lg">
  //             <div className="flex items-center justify-between">
  //               <span className="font-medium text-secondary text-sm">Secret Code:</span>
  //               <button
  //                 onClick={handleCopySecret}
  //                 className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
  //               >
  //                 <CopyIcon width={16} height={16} />
  //                 <span className="text-sm font-medium">Copy</span>
  //               </button>
  //             </div>
  //             <div className="font-mono text-sm bg-white p-2 rounded border break-all">
  //               {data.secret}
  //             </div>
  //             <p className="text-xs text-grey-600">
  //               Enter this code manually in your authenticator app if you can't scan the QR code.
  //             </p>
  //           </div>
  //         )}
  //       </div>
  //       <div className="font-inter space-y-3">
  //         <h4 className="font-medium text-secondary leading-6 ">Step 3:</h4>
  //         <span className="text-[#000933A6] inline-block">Copy and paste the 6-digit code from your authenticator app below:</span>
  //         <Textinput
  //           name="token"
  //           value={values.token}
  //           error={errors.token}
  //           onChange={handleChange}
  //           placeholder="673528"
  //           end={
  //             <button onClick={handlePaste} type="button" className="text-primary font-semibold font-inter text-sm capitalize cursor-pointer">
  //               Paste code
  //             </button>
  //           }
  //         />
  //       </div>
  //     </div>
  //     <div className="flex justify-end items-center gap-3 mt-5">
  //       <button onClick={() => close("setup2fa")} type="button" className="btn-outline">Cancel</button>
  //       <button onClick={handleSubmit} type="button" className="btn">
  //         <span>Complete setup</span>
  //         <Spinner loading={isMutating} className="!size-4" />
  //       </button>
  //     </div>
  //   </div>
  // )

  const header = (
    <h3 className="text-secondary font-inter font-semibold text-xl">Setup 2FA</h3>
  )

  const footer = (
    <div className="flex justify-end items-center gap-3 mt-5">
      <button onClick={() => close("setup2fa")} type="button" className="btn-outline">Cancel</button>
      <button onClick={handleSubmit} type="button" className="btn">
        <span>Complete setup</span>
        <Spinner loading={isMutating} className="!size-4" />
      </button>
    </div>
  )

  return (
    <ModalWrapper
      isMobile={isMobile}
      header={header}
      footer={footer}
      onClose={() => close("setup2fa")}
    >
      <div className="space-y-4">
        <h3 className="text-secondary hidden sm:block font-inter font-semibold text-xl">Setup 2FA</h3>
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
            <span
              className="text-primary inline-block ml-1 hover:underline cursor-pointer"
              onClick={() => setShowSecret(!showSecret)}
            >
              {showSecret ? "Show QR code" : "Add Secret code manually"}
            </span>
          </span>
          {!showSecret ? (
            <div className="size-56 rounded-lg border border-[#0011661A]">
              <img src={data.qrcode} alt="qrcode" className="size-full object-cover" />
            </div>
          ) : (
            <div className="space-y-2 p-4 bg-grey-400 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium text-secondary text-sm">Secret Code:</span>
                <button
                  onClick={handleCopySecret}
                  className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
                >
                  <CopyIcon width={16} height={16} />
                  <span className="text-sm font-medium">Copy</span>
                </button>
              </div>
              <div className="font-mono text-sm bg-white p-2 rounded border break-all">
                {data.secret}
              </div>
              <p className="text-xs text-grey-600">
                Enter this code manually in your authenticator app if you can't scan the QR code.
              </p>
            </div>
          )}
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
    </ModalWrapper >
  )
}