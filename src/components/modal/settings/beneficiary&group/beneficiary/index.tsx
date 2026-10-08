import type { IPagination } from "@/utility/interface";
import useSWR from "swr";
import { cn } from "@/utility";
import { SETTINGS_BENEFICIARIES_SWR_KEY } from "../beneficiaries-list-swr-key";
import { BeneficiaryCard } from "./beneficiary-card";
import type { IBeneficiaryWithGroups } from "./beneficiary-types";

export type { IBeneficiaryWithGroups } from "./beneficiary-types";

export default function Beneficiary() {
  const { data, isLoading } = useSWR<{ data?: IPagination<IBeneficiaryWithGroups> }>(SETTINGS_BENEFICIARIES_SWR_KEY);

  const pageData = data?.data;
  const docs = pageData?.docs ?? [];

  return (
    <div className="flex flex-col gap-4">
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[0, 1].map((k) => (
            <div
              key={k}
              className={cn(
                "h-56 rounded-3xl border border-v3-stroke-weak bg-fill-neutral-weak",
                "motion-safe:animate-pulse",
              )}
              aria-hidden
            />
          ))}
        </div>
      ) : docs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-v3-stroke-weak bg-fill-neutral-weak px-4 py-10 text-center">
          <p className="font-inter text-sm font-medium text-v3-text-strong">No beneficiaries yet</p>
          <p className="mt-1 font-inter text-sm text-v3-text-weak">
            Add a beneficiary to give them access to your Memento.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {docs.map((b) => (
            <BeneficiaryCard key={b._id} beneficiary={b} />
          ))}
        </div>
      )}
    </div>
  );
}
