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
    <div className="flex w-full max-w-lg flex-col gap-6 sm:gap-10 py-8 sm:py-16 md:py-20 px-2 sm:px-0">
      <span onClick={() => router.back()} className="underline text-grey-200 cursor-pointer mb-2 w-fit">Go back</span>
      <div className="flex flex-col gap-4 sm:gap-5 rounded-3xl bg-surface p-4 sm:p-8 md:p-10">
        <span className="font-bricolage text-2xl sm:text-3xl md:text-[32px] leading-8 sm:leading-10 font-bold">
          Add beneficiaries
        </span>
        <AddBeneficiaries />

        {!isEmpty(data?.data?.docs) && (
          <div className="space-y-3 rounded-lg bg-white p-4">
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
      </div>
      <div className="flex items-end justify-end font-geist font-bold text-base mt-4">
        <Link
          prefetch={false}
          href="/login"
          className="rounded-lg flex items-center justify-center text-center text-white bg-secondary px-4 cursor-pointer h-12"
        >
          Continue
        </Link>
      </div>
    </div>
  );
}
