"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import useSWR from "swr";
import { useModal } from "@/hooks/use-modal";
import { cn } from "@/utility";
import type { IPagination, IGroup } from "@/utility/interface";
import { groupsListKey, groupsListFetcher } from "@/api/groups";
import Beneficiary from "./beneficiary";
import GroupManagement from "./group";
import { SETTINGS_BENEFICIARIES_SWR_KEY } from "./beneficiaries-list-swr-key";
import type { IBeneficiaryWithGroups } from "./beneficiary/beneficiary-types";
import { useSubscription } from "@/contexts/subscription";
import { UpgradePrompt } from "@/features/pricing/upgrade-prompt";
import { useFeatureFlags } from "@/contexts/feature-flags";

type BeneficiaryTab = "beneficiary" | "groups";

export default function BeneficiaryAndGroup() {
  const { push } = useModal();
  const { isProOrAbove } = useSubscription();
  const { canUse } = useFeatureFlags();
  const [beneficiaryGateOpen, setBeneficiaryGateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<BeneficiaryTab>("beneficiary");

  const { data: beneficiariesRes } = useSWR<{ data?: IPagination<IBeneficiaryWithGroups> }>(
    SETTINGS_BENEFICIARIES_SWR_KEY,
  );
  const { data: groupsPage } = useSWR<IPagination<IGroup>>(groupsListKey(1), groupsListFetcher, {
    revalidateOnFocus: false,
  });

  const beneficiaryCount = beneficiariesRes?.data?.totalDocs ?? beneficiariesRes?.data?.docs?.length ?? 0;
  const groupCount = groupsPage?.totalDocs ?? 0;
  const atBeneficiaryLimit = !isProOrAbove && beneficiaryCount >= 2;
  const canCreateBeneficiary = canUse("beneficiary.create");
  const canCreateGroup = canUse("group.create");

  return (
    <div className="flex w-full flex-col gap-6">
      <header className="flex min-w-0 items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="font-inter text-base font-bold text-v3-text-strong text-balance">Beneficiary &amp; groups</span>
          <span className="font-inter text-sm text-v3-text-weak text-pretty">
            Your beneficiaries can access your Memento. Use groups to organize them.
          </span>
        </div>
        {activeTab === "groups" && (
          <Button
            type="button"
            size="sm"
            className="h-8 shrink-0 rounded-full !bg-v3-fill-strong px-3 font-inter text-xs font-semibold !text-white hover:!opacity-90"
            disabled={!canCreateGroup}
            onClick={() => push?.("add-group")}
          >
            Add group
          </Button>
        )}
      </header>

      <div className="flex w-full flex-col gap-5 rounded-2xl border border-v3-stroke-weak bg-bg-neutral p-5">
        {/* Tabs + CTA */}
        <div className="flex items-center justify-between gap-3">
          <nav aria-label="Beneficiary and group sections">
            <div role="tablist" aria-orientation="horizontal" className="flex items-center gap-1.5">
              {(["beneficiary", "groups"] as const).map((tab) => {
                const isActive = activeTab === tab;
                const label = tab === "beneficiary" ? "Beneficiaries" : "Groups";
                const count = tab === "beneficiary" ? beneficiaryCount : groupCount;
                return (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "inline-flex h-8 items-center gap-1.5 rounded-full px-3 font-inter text-xs font-medium tabular-nums",
                      "motion-safe:transition-[background-color,color] motion-safe:duration-150 motion-safe:ease-out",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v3-stroke-strong focus-visible:ring-offset-2",
                      isActive
                        ? "bg-v3-fill-strong text-white"
                        : "text-v3-text-weak hover:bg-v3-fill-weak hover:text-v3-text-strong",
                    )}
                  >
                    {label}
                    <span className={cn("rounded-full px-1.5 py-px text-[10px]", isActive ? "bg-fill-inverse-strong/20 text-white" : "bg-v3-fill-weak text-v3-text-weaker")}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>

          {activeTab === "beneficiary" && (
            <Button
              type="button"
              size="sm"
              className="h-8 shrink-0 rounded-full !bg-v3-fill-strong px-3 font-inter text-xs font-semibold !text-white hover:!opacity-90"
              disabled={!canCreateBeneficiary}
              onClick={() => {
                if (!canCreateBeneficiary) return;
                if (atBeneficiaryLimit) {
                  setBeneficiaryGateOpen(true);
                  return;
                }
                push?.("add-beneficiary");
              }}
            >
              Add beneficiary
            </Button>
          )}
        </div>

        <div className="border-t border-v3-stroke-weak pt-1">
          {activeTab === "beneficiary" ? <Beneficiary /> : <GroupManagement />}
        </div>
      </div>

      <UpgradePrompt
        feature="beneficiaries"
        variant="modal"
        open={beneficiaryGateOpen}
        onOpenChange={setBeneficiaryGateOpen}
      />
    </div>
  );
}
