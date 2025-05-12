import { ModalCloseBtn } from "@/components/ModalLayout";
import { useModal } from "@/hooks/use-modal";
import Image from "next/image";
import qrcode from "@/public/image/qrcode.png"
import { Textinput } from "@/components/Form";

export default function Setup2FA() {
  const { close } = useModal()
  return (
    <div className="modal-container !max-w-154.5">
      <ModalCloseBtn onClick={() => close("setup2fa")} />
      <h3 className="text-secondary font-inter font-semibold text-xl">Setup 2FA</h3>
      <div className="space-y-4">
        <div className="font-inter space-y-3">
          <h4 className="font-medium text-secondary leading-6 ">Step 1:</h4>
          <span className="text-[#000933A6] inline-block">Download the 2FA apps</span>
          <ol className="list-decimal list-inside font-medium">
            <li>Google Authenticator</li>
            <li>Authy.</li>
          </ol>
        </div>
        <div className="font-inter space-y-3">
          <h4 className="font-medium text-secondary leading-6 ">Step 2:</h4>
          <span className="text-[#000933A6] inline-block">Scan the QR code below to pair Memento with your authenticator app. Cannot scan the QR code? Add Secret code manually.</span>
          <div className="size-56 rounded-lg border border-[#0011661A]">
            <Image src={qrcode} alt="qrcode" className="size-full object-cover" />
          </div>
        </div>
        <div className="font-inter space-y-3">
          <h4 className="font-medium text-secondary leading-6 ">Step 3:</h4>
          <span className="text-[#000933A6] inline-block">Copy and paste the 6-digit code from your authenticator app below:</span>
          <Textinput
            name="code"
            placeholder="673528"
            end={
              <button className="text-primary font-semibold font-inter text-sm capitalize cursor-pointer">
                Paste code
              </button>
            }
          />
        </div>
      </div>
      <div className="flex justify-end items-center gap-3 mt-5">
        <button type="button" className="btn-outline">Cancel</button>
        <button type="button" className="btn">Complete setup</button>
      </div>
    </div>
  )
}