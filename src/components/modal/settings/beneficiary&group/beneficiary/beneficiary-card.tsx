import dayjs from "dayjs";
import { useModal } from "@/hooks/use-modal";
import { isEmpty } from "@/utility";
import { PersonCard } from "../person-card";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import type { IBeneficiaryWithGroups } from "./beneficiary-types";

type BeneficiaryCardProps = {
  beneficiary: IBeneficiaryWithGroups;
};

export function BeneficiaryCard({ beneficiary }: BeneficiaryCardProps) {
  const { open } = useModal();
  const pending = isEmpty(beneficiary.accepted_at);
  const status = pending
    ? "Invite pending"
    : `Added ${dayjs(beneficiary.accepted_at).format("MMM D, YYYY")}`;

  return (
    <PersonCard
      name={beneficiary.name}
      email={beneficiary.email}
      user={beneficiary.user}
      details={[beneficiary.relationship, status]}
      menu={
        <>
          {pending ? (
            <DropdownMenuItem onSelect={() => open?.("resend-invite", beneficiary)}>
              Resend invite
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem onSelect={() => open?.("update-beneficiary", beneficiary)}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-text-error-strong focus:text-text-error-strong"
            onSelect={() => open?.("delete-beneficiary", beneficiary?._id)}
          >
            Remove
          </DropdownMenuItem>
        </>
      }
    />
  );
}
