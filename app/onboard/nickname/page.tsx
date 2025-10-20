import { Textinput } from "@/components/Form";
import Link from "next/link";

export default function NicknamePage() {
  return (
    <div className="flex flex-1 flex-col gap-10 p-10">
      <span className="text-2xl leading-[28px] font-garamond text-gray-950/80">Before we proceed, what should i call you?</span>
      <Textinput
        label="Name"
        placeholder="Groot"
        className="flex-1"
      />
      <div className="w-full border-t border-black/5" />
      <div>
        <Link
          href="/onboard/misc"
          prefetch
          className="bg-blue-6 text-white text-sm leading-[20px] cursor-pointer font-semibold rounded-full py-[18px] px-8"
        >
          Continue
        </Link>
      </div>
    </div>
  )
}
