import type { IBeneficiary } from "@/utility/interface";

export interface IBeneficiaryWithGroups extends IBeneficiary {
  groups: { _id: string; name: string; color?: number }[];
}
