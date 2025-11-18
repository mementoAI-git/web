"use client";

import { Link, useNavigate } from "react-router-dom";
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
    <div className="flex flex-1 flex-col gap-10 p-10">
      <div className="flex flex-col gap-4">
        <h3 className="font-garamond text-[32px] font-medium leading-[38px] text-gray-950/90">
          Great. Now let’s add some beneficiaries
        </h3>
        <span className="font-garamond text-2xl font-normal leading-[28px] text-gray-950/80">
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
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="rounded-full bg-black/4 px-8 py-[18px] text-sm font-semibold leading-[20px] text-gray-900"
        >
          Prev
        </button>
        <div className="flex items-stretch gap-2">
          <Link
            to="/overview"
            className="rounded-full px-8 py-[18px] text-sm font-semibold leading-[20px] bg-sand-2 text-sand-10"
          >
            Skip for now
          </Link>
          <Link
            to="/overview"
            className="rounded-full bg-blue-6 px-8 py-[18px] text-sm font-semibold leading-[20px] text-white transition-colors duration-200 hover:bg-blue-7"
          >
            Continue
          </Link>
        </div>
      </div>
    </div>
  );
}


