import type { IBeneficiary } from "@/utility/interface";
import { GROUP_COLORS } from "@/utility/constant";
import type { SearchResultItem } from "./access-field-types";

export function stableColorIndexFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h) % GROUP_COLORS.length;
}

function resolveBeneficiaryPaletteIndex(b: IBeneficiary): number {
  const c = b.color;
  if (typeof c === "number" && Number.isInteger(c) && c >= 0 && c < GROUP_COLORS.length) {
    return c;
  }
  return stableColorIndexFromId(b._id ?? "");
}

function toSearchItemFromBeneficiary(b: IBeneficiary): SearchResultItem {
  return {
    id: b._id ?? "",
    name: b.name,
    source: "beneficiary",
    color: resolveBeneficiaryPaletteIndex(b),
    avatar: { userId: b.user?._id, email: b.user?.email || b.email, src: b.user?.picture_url },
  };
}

/** Map API beneficiary → access chip item (Create memory draft restore). */
export function beneficiaryToAccessItem(b: IBeneficiary): SearchResultItem | null {
  if (!b._id) return null;
  return toSearchItemFromBeneficiary(b);
}

/** Use only after narrowing to beneficiaries with `_id` (e.g. AccessField list). */
export function toBeneficiarySearchItem(b: IBeneficiary): SearchResultItem {
  return toSearchItemFromBeneficiary(b);
}
