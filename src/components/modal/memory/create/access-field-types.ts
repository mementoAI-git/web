export type SearchResultItem = {
  id: string;
  name: string;
  source: "group" | "beneficiary";
  /** Resolved palette index 0–6 for beneficiaries; ignored for groups in styling */
  color?: number;
};
