"use client";

import { useState } from "react";
import useSWR from "swr";
import { useModal } from "@/hooks/use-modal";
import { cn } from "@/utility";
import { SettingsPillButton } from "../settings-action-row";
import type { IPagination, IGroup } from "@/utility/interface";
import { groupsListKey, groupsListFetcher } from "@/api/groups";
import Beneficiary from "./beneficiary";
import GroupManagement from "./group";
import { SETTINGS_BENEFICIARIES_SWR_KEY } from "./beneficiaries-list-swr-key";
import type { IBeneficiaryWithGroups } from "./beneficiary/beneficiary-types";

type BeneficiaryTab = "beneficiary" | "groups";

export default function BeneficiaryAndGroup() {
  const { push } = useModal();
  const [activeTab, setActiveTab] = useState<BeneficiaryTab>("beneficiary");

  const { data: beneficiariesRes } = useSWR<{ data?: IPagination<IBeneficiaryWithGroups> }>(
    SETTINGS_BENEFICIARIES_SWR_KEY,
  );
  const { data: groupsPage } = useSWR<IPagination<IGroup>>(groupsListKey(1), groupsListFetcher, {
    revalidateOnFocus: false,
  });

  const beneficiaryCount = beneficiariesRes?.data?.totalDocs ?? beneficiariesRes?.data?.docs?.length ?? 0;
  const groupCount = groupsPage?.totalDocs ?? 0;

  return (
    <div className="flex w-full flex-col gap-6">
      <header className="flex w-full min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="font-inter text-base font-bold text-v3-text-strong text-balance">Beneficiary &amp; groups</span>
          <span className="font-inter text-sm text-v3-text-weak text-pretty">
            Your beneficiaries can access your Memento. Use groups to organize them.
          </span>
        </div>
        {activeTab === "beneficiary" ? (
          <div className="flex shrink-0 justify-end sm:pt-0.5">
            <SettingsPillButton type="button" variant="default" onClick={() => push?.("add-beneficiary")}>
              Add beneficiary
            </SettingsPillButton>
          </div>
        ) : null}
      </header>

      <nav aria-label="Beneficiary and group sections" className="w-full">
        <div role="tablist" aria-orientation="horizontal" className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "beneficiary"}
            onClick={() => setActiveTab("beneficiary")}
            aria-label={`Beneficiaries, ${beneficiaryCount} ${beneficiaryCount === 1 ? "person" : "people"}`}
            className={cn(
              "inline-flex h-fit w-fit items-center justify-center gap-2 rounded-full px-5 py-2 font-inter text-xs leading-[18px] tabular-nums",
              "motion-safe:transition-[background-color,border-color,color,box-shadow] motion-safe:duration-200 motion-safe:ease-out",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v3-stroke-strong focus-visible:ring-offset-2",
              activeTab === "beneficiary"
                ? "border border-v3-stroke-strong bg-card font-semibold text-v3-text-strong shadow-sm"
                : "border border-v3-stroke-weak bg-transparent font-medium text-v3-text-weak hover:border-v3-stroke-strong hover:text-v3-text-strong",
            )}
          >
            <span className={cn(activeTab === "beneficiary" && "font-normal text-v3-text-weak")}>Beneficiary</span>
            <span className="font-normal text-v3-text-weak">{beneficiaryCount}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "groups"}
            onClick={() => setActiveTab("groups")}
            aria-label={`Groups, ${groupCount} ${groupCount === 1 ? "group" : "groups"}`}
            className={cn(
              "inline-flex h-fit w-fit items-center justify-center gap-2 rounded-full px-5 py-2 font-inter text-xs leading-[18px] tabular-nums",
              "motion-safe:transition-[background-color,border-color,color,box-shadow] motion-safe:duration-200 motion-safe:ease-out",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v3-stroke-strong focus-visible:ring-offset-2",
              activeTab === "groups"
                ? "border border-v3-stroke-strong bg-card font-semibold text-v3-text-strong shadow-sm"
                : "border border-v3-stroke-weak bg-transparent font-medium text-v3-text-weak hover:border-v3-stroke-strong hover:text-v3-text-strong",
            )}
          >
            <span className={cn(activeTab === "groups" && "font-normal text-v3-text-weak")}>Group</span>
            <span className="font-normal text-v3-text-weak">{groupCount}</span>
          </button>
        </div>
      </nav>

      {activeTab === "beneficiary" ? <Beneficiary /> : <GroupManagement />}
    </div>
  );
}
