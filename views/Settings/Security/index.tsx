import { Textinput } from "@/components/Form";

export function Security() {
  return (
    <div>
      <div className="space-y-3">
        <h4 className="text-secondary font-medium font-bricolage text-4xl">Security</h4>
        <small className="text-base font-inter text-grey-600">Manage your memento security</small>
      </div>
      <div className="py-8 flex flex-col gap-6">
        <Textinput
          label="Password"
          labelClassName="!text-grey-200 !font-normal"
          placeholder="Last changed 18/12/2024"
          end={<span className="text-primary font-semibold font-inter text-sm cursor-pointer">Change password</span>}
        />

        <div className="text-[#000933A6] font-inter space-y-2">
          <div className="flex items-center gap-3">
            <span className="font-bold">2FA Verification</span>
            <span className="bg-[#FF4A4A0D] border rounded-full border-[#C73A3A24] text-sm text-[#C73A3A] inline-block py-0.5 px-2.5">Not activated</span>
          </div>
          <span className="inline-block">
            An extra layer to boost your Memento account Security. A verification code will be required in addition to your password each time you sign in.
          </span>
          <button className="border-primary shadow-md cursor-pointer border rounded-lg px-3 py-1 text-sm text-primary font-bold max-w-32.5">
            Setup 2FA
          </button>
        </div>
      </div>
    </div>
  )
}