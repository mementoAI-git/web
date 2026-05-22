"use client";

import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import useSWR from "swr";
import endpoint from "@/api/endpoint";
import { isEmpty } from "@/utility";
import AddBeneficiaries from "../components/add-beneficiaries";
import BeneficiaryItem from "../components/beneficiary-item";

export default function BeneficiaryPage() {
  const { data } = useSWR(endpoint.beneficiaries);
  const navigate = useNavigate();
  const invites = data?.data?.docs ?? [];

  return (
    <div className="flex flex-1 flex-col gap-8 p-4 sm:p-6 lg:gap-10 lg:p-10">
      <div className="flex flex-col gap-4">
        <h3 className="font-garamond text-[28px] font-medium leading-[34px] text-gray-950/90 sm:text-[32px] sm:leading-[38px]">
          Great. Now let’s add some beneficiaries
        </h3>
        <span className="font-garamond text-xl font-normal leading-[28px] text-gray-950/80 sm:text-2xl">
          Is there someone you’d like to share your Memento with? You can simply invite them as a
          beneficiary.
        </span>
      </div>

      <AddBeneficiaries />

      {!isEmpty(invites) && (
        <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4">
          <span className="font-inter text-sm font-semibold uppercase tracking-[2px] text-grey-300">
            invites
          </span>
          <div className="mt-4 space-y-3">
            {invites.map((item: { email: string }, index: number) => (
              <BeneficiaryItem email={item.email} key={`${item.email}-${index}`} />
            ))}
          </div>
        </div>
      )}

      <div className="w-full border-t border-black/5" />
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={() => navigate(-1)}
          className="w-full rounded-full bg-black/4 px-8 py-[18px] text-sm font-semibold leading-[20px] text-gray-900 sm:w-auto"
        >
          Prev
        </button>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
          <Link
            to="/overview"
            className="rounded-full bg-sand-2 px-8 py-[18px] text-center text-sm font-semibold leading-[20px] text-sand-10"
          >
            Skip for now
          </Link>
          <Button
            asChild
            className="rounded-full !bg-v3-brand-strong px-8 py-[18px] text-sm font-semibold leading-[20px] text-white hover:!opacity-90"
          >
            <Link to="/overview">Continue</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

