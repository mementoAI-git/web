"use client";

import endpoint from "@/api/endpoint";
import { isEmpty } from "@/utility";
import useSWR from "swr";
import AddBeneficiaries from "./add-benficiaries";
import BeneficiaryItem from "./beneficiary-item";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function BeneficiaryPage() {
  const { data } = useSWR(endpoint.beneficiaries);
  const router = useRouter();

  const handleContinue = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('welcome_once', '1')
    }
    router.push("/overview")
  }

  return (
    <div className="flex flex-1 flex-col gap-10 p-10">
      <div className="flex flex-col gap-4">
        <h3 className="text-[32px] text-gray-950/90 leading-[38px] font-garamond font-medium">
          Great. Now let’s add some beneficiaries
        </h3>
        <span className="text-gray-950/80 text-2xl !leading-[28px] font-garamond font-normal">
          Is there someone you’d like to share your Memento with? You can simply invite them as a beneficiary.
        </span>
      </div>
      <AddBeneficiaries />

      {!isEmpty(data?.data?.docs) && (
        <div className="space-y-3 border border-gray-200 rounded-2xl bg-white p-4">
          <span className="font-inter text-sm font-semibold tracking-[2px] text-grey-300 uppercase">
            invites
          </span>
          <div className="mt-4 space-y-3">
            {data?.data?.docs?.map((item, i) => (
              <BeneficiaryItem email={item.email} key={i} />
            ))}
          </div>
        </div>
      )}

      <div className="w-full border-t border-black/5" />
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="bg-black/4 text-gray-900 text-sm leading-[20px] cursor-pointer font-semibold rounded-full py-[18px] px-8"
        >
          Prev
        </button>
        <div className="flex items-stretch gap-2">
          <Link
            href="/overview"
            prefetch
            className="border text-gray-900 text-sm leading-[20px] cursor-pointer font-semibold rounded-full py-[18px] px-8"
          >
            Skip for now
          </Link>
          <button
            onClick={handleContinue}
            className="bg-blue-6 text-white text-sm leading-[20px] cursor-pointer font-semibold rounded-full py-[18px] px-8"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
