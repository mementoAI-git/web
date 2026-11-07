import { Button } from "@/components/ui/button";
import { useRequestRecovery } from "@/hooks/use-request-recovery";
import type { IPagination } from "@/utility/interface";
import useSWR from "swr";
import { SETTINGS_BENEFICIARIES_SWR_KEY } from "../beneficiaries-list-swr-key";
import { BeneficiaryCard } from "./beneficiary-card";
import type { IBeneficiaryWithGroups } from "./beneficiary-types";

export type { IBeneficiaryWithGroups } from "./beneficiary-types";

export default function Beneficiary() {
  const { data, isLoading, error, mutate, isValidating } = useSWR<{ data?: IPagination<IBeneficiaryWithGroups> }>(SETTINGS_BENEFICIARIES_SWR_KEY, { shouldRetryOnError: false });
  const retry = useRequestRecovery("settings-beneficiaries", error, mutate, "We couldn’t load your beneficiaries. Please try again.");

  const docs = data?.data?.docs ?? [];

  return (
    <div className="flex flex-col gap-4">
      {error ? <Button variant="outline" className="self-start" onClick={retry} disabled={isValidating}>Retry loading beneficiaries</Button> : null}
      {isLoading && !data ? (
        <div role="status" aria-label="Loading beneficiaries" className="flex flex-col gap-4">
          {[0, 1].map((k) => (
            <div key={k} className="settings-card h-[88px] motion-safe:animate-pulse" aria-hidden />
          ))}
        </div>
      ) : !data && error ? null : docs.length === 0 ? (
        <div className="settings-card px-4 py-10 text-center sm:px-6">
          <p className="text-sm font-medium text-text-neutral-strong">No people yet</p>
          <p className="mt-1 text-sm text-text-neutral-weak">
            Invite someone to start sharing memories together.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {docs.map((person) => (
            <li key={person._id}>
              <BeneficiaryCard beneficiary={person} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
