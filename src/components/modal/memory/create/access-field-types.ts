export type SearchResultItem = {
  id: string;
  name: string;
  source: "group" | "beneficiary";
  /** Stored or resolved palette index 0–6 used by groups and beneficiaries. */
  color?: number;
};
