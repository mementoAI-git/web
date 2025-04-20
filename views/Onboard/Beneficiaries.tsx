"use client"

import useSWR from "swr";
import AddBeneficiaries from "./AddBeneficiaries";
import BeneficiaryItem from "./BeneficiaryItem";
import endpoint from "@/api/endpoint";
import { isEmpty } from "@/utility";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function Beneficiaries() {
  const router = useRouter()
  const { data } = useSWR(endpoint.beneficiaries)
  return (
    <div className="max-w-[583px] flex flex-col gap-10 py-20 w-full">
      <div className="bg-surface flex flex-col p-10 gap-5 rounded-3xl">
        <span className="font-bold text-[32px] leading-10 font-bricolage">Add beneficiaries</span>
        <AddBeneficiaries />

        {
          !isEmpty(data?.data) &&
          <div className="bg-white space-y-3 p-4 rounded-lg">
            <span className="uppercase font-inter text-sm text-grey-300 font-semibold tracking-[2px]">invites</span>
            <div className="space-y-3 mt-4">
              {data?.data?.map((item, i) => <BeneficiaryItem email={item.email} key={i} />)}
            </div>
          </div>
        }
      </div>
      <div className="flex items-end justify-between font-geist font-bold text-base">
        <span onClick={() => router.back()} className="underline text-grey-200 cursor-pointer">Go back</span>
        <Link prefetch={false} href="/overview" className="rounded-lg flex items-center justify-center text-center text-white bg-secondary px-4 cursor-pointer h-12">Continue</Link>
      </div>
    </div>
  )
}