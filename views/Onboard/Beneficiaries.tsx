"use client";

import useSWR from "swr";
import AddBeneficiaries from "./AddBeneficiaries";
import BeneficiaryItem from "./BeneficiaryItem";
import endpoint from "@/api/endpoint";
import { isEmpty } from "@/utility";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function Beneficiaries() {
  const router = useRouter();
  const { data } = useSWR(endpoint.beneficiaries);
  return (
    <div className="flex w-full max-w-[583px] flex-col gap-10 py-20">
      <div className="flex flex-col gap-5 rounded-3xl bg-surface p-10">
        <span className="font-bricolage text-[32px] leading-10 font-bold">
          Add beneficiaries
        </span>
        <AddBeneficiaries />

        {!isEmpty(data?.data) && (
          <div className="space-y-3 rounded-lg bg-white p-4">
            <span className="font-inter text-sm font-semibold tracking-[2px] text-grey-300 uppercase">
              invites
            </span>
            <div className="mt-4 space-y-3">
              {data?.data?.map((item, i) => (
                <BeneficiaryItem email={item.email} key={i} />
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="flex items-end justify-between font-geist font-bold text-base">
        <span onClick={() => router.back()} className="underline text-grey-200 cursor-pointer">Go back</span>
        <Link prefetch={false} href="/overview" className="rounded-lg flex items-center justify-center text-center text-white bg-secondary px-4 cursor-pointer h-12">Continue</Link>
      </div>
    </div>
  );
}
