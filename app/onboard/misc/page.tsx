import { Dateinput, Textinput } from "@/components/Form";
import TerminalIcon from "@/public/icon/terminal.svg";
import Link from "next/link";

export default function MiscPage() {
  return (
    <div className="flex flex-1 flex-col gap-10 p-10">
      <div className="flex flex-col gap-4">
        <h3 className="text-[32px] text-gray-950/90 leading-[38px] font-garamond font-medium">
          Okay, Groot. I’ve got some questions for you.
        </h3>
        <span className="text-gray-950/80 text-2xl !leading-[28px] font-garamond font-normal">
          These questions will help Memento better personalize your experience on the product.
        </span>
      </div>
      <Dateinput
        id="onboard-profile-dob"
        name="dob"
        label="Date of birth"
        className="!font-garamond text-[20px] placeholder:!text-[#667085]"
        labelClassName="!text-gray-950/90"
        required
      />
      <div className="space-y-6">
        <p className="font-garamond font-medium text-[24px] leading-[32px] text-gray-950/80">
          What brings you to Memento? <span className="text-orange">(multi-select)</span>
        </p>
        <ul className="flex gap-3 flex-wrap">
          {
            [1, 2, 3, 4].map((_, i) => (
              <li key={i} className="border border-gray-200 flex gap-3 w-fit items-center rounded-lg py-2.5 px-4">
                <div className="size-5 flex items-center justify-center text-gray-500" >
                  <TerminalIcon width={14} height={12} strokeWidth={2} />
                </div>
                <span className="text-gray-950/90 text-base font-inter">Reflect on past memories</span>
              </li>
            ))
          }
        </ul>
      </div>
      <Textinput
        name="d"
        label="How would you describe yourself in a few words?"
        labelClassName="!text-gray-950/90"
        className="!font-garamond text-[20px] placeholder:!text-[#667085]"
        placeholder="Eg: Curious, ambitious, simple "
        required
      />
      <Textinput
        name="do"
        label="What matters most to you now?"
        labelClassName="!text-gray-950/90"
        className="!font-garamond text-[20px] placeholder:!text-[#667085]"
        placeholder="Eg: Family, self growth, creativity, etc"
        required
      />
      <div className="w-full border-t border-black/5" />
      <div className="flex items-center justify-between">
        <button
          className="bg-black/4 text-gray-900 text-sm leading-[20px] cursor-pointer font-semibold rounded-full py-[18px] px-8"
        >
          Prev
        </button>
        <Link
          prefetch
          href="/onboard/beneficiary"
          className="bg-blue-6 text-white text-sm leading-[20px] cursor-pointer font-semibold rounded-full py-[18px] px-8"
        >
          Continue
        </Link>
      </div>
    </div>
  )
}