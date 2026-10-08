import dayjs from "dayjs";
import { useModal } from "@/hooks/use-modal";
import UserItem from "@/components/user-item";
import { cn, isEmpty } from "@/utility";
import { tagColors, GROUP_COLORS } from "@/utility/constant";
import { SettingsPillButton } from "../../settings-action-row";
import type { IBeneficiaryWithGroups } from "./beneficiary-types";

const compactPill = "!min-h-9 px-3 py-1.5 text-xs";

type BeneficiaryCardProps = {
  beneficiary: IBeneficiaryWithGroups;
};

export function BeneficiaryCard({ beneficiary }: BeneficiaryCardProps) {
  const { open } = useModal();

  return (
    <article
      className={cn(
        "flex flex-col gap-4 rounded-3xl border border-v3-stroke-weak bg-fill-neutral-weak p-4",
        "motion-safe:transition-shadow motion-safe:duration-200 motion-safe:ease-out",
      )}
    >
      <UserItem name={beneficiary.name} email={beneficiary.email} user={beneficiary.user} avatarSize="lg" />

      <dl className="grid gap-2 font-inter text-xs">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <dt className="font-medium text-v3-text-weak">Date added</dt>
          <dd className="text-v3-text-strong">
            {isEmpty(beneficiary?.accepted_at) ? (
              <span className={cn("mem-tags", tagColors[beneficiary?.status as keyof typeof tagColors])}>
                {beneficiary?.status}
              </span>
            ) : (
              dayjs(beneficiary.accepted_at).format("MMM DD, YYYY")
            )}
          </dd>
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <dt className="font-medium text-v3-text-weak">Relationship</dt>
          <dd className="capitalize text-v3-text-strong">{beneficiary?.relationship || "—"}</dd>
        </div>
        {(beneficiary?.groups?.length ?? 0) > 0 ? (
          <div className="flex flex-col gap-1.5">
            <dt className="font-medium text-v3-text-weak">Groups</dt>
            <dd>
              <div className="flex flex-wrap gap-1.5">
                {(beneficiary.groups ?? []).map((group) => {
                  const colorClass = GROUP_COLORS[Math.min(group.color ?? 0, GROUP_COLORS.length - 1)];
                  return (
                    <span
                      key={group._id}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-inter text-xs font-medium",
                        colorClass,
                      )}
                    >
                      @{group.name}
                    </span>
                  );
                })}
              </div>
            </dd>
          </div>
        ) : null}
      </dl>

      <div className="mt-auto flex flex-wrap justify-end gap-2 border-t border-v3-stroke-weak pt-3">
        {isEmpty(beneficiary.accepted_at) ? (
          <SettingsPillButton type="button" variant="default" className={compactPill} onClick={() => open?.("resend-invite", beneficiary)}>
            Resend
          </SettingsPillButton>
        ) : null}
        <SettingsPillButton type="button" variant="default" className={compactPill} onClick={() => open?.("update-beneficiary", beneficiary)}>
          Edit
        </SettingsPillButton>
        <SettingsPillButton type="button" variant="destructive" className={compactPill} onClick={() => open?.("delete-beneficiary", beneficiary?._id)}>
          Remove
        </SettingsPillButton>
      </div>
    </article>
  );
}
