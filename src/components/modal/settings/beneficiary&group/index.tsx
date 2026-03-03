"use client";

import { useState } from "react";
import { cn } from "@/utility";
import Beneficiary from "./beneficiary";
import GroupManagement from "./group";

type BeneficiaryTab = "beneficiary" | "groups";

export default function BeneficiaryAndGroup() {
  const [activeTab, setActiveTab] = useState<BeneficiaryTab>("beneficiary");

  return (
    <div className="flex w-full flex-col gap-10 py-6">
      <div className="flex flex-col gap-2">
        <span className="font-inter text-base font-bold text-gray-950/90">
          Beneficiary & groups
        </span>
        <span className="font-inter text-sm text-gray-950/70">
          Your beneficiaries are allowed access to your Memento. Create and manage groups to organize them.
        </span>
      </div>

      <div className="flex w-full items-center gap-2 border-b border-gray-200 sm:gap-6">
        <button
          type="button"
          onClick={() => setActiveTab("beneficiary")}
          className={cn(
            "border-b-2 border-transparent pb-3 font-inter text-sm font-normal text-gray-500 transition-colors hover:text-gray-950/80",
            activeTab === "beneficiary" && "border-gray-950 font-semibold text-gray-950/90"
          )}
        >
          Beneficiary
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("groups")}
          className={cn(
            "border-b-2 border-transparent pb-3 font-inter text-sm font-normal text-gray-500 transition-colors hover:text-gray-950/80",
            activeTab === "groups" && "border-gray-950 font-semibold text-gray-950/90"
          )}
        >
          Group
        </button>
      </div>

      {
        activeTab === "beneficiary" ?
          <Beneficiary /> :
          <GroupManagement />
      }
    </div>
  );
}
