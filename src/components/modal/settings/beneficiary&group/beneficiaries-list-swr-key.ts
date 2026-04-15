import endpoint from "@/api/endpoint";

/** Settings beneficiary grid (no pagination UI). Use this exact string for `useSWR` and `mutate()` after add/remove/resend. */
export const SETTINGS_BENEFICIARIES_SWR_KEY = `${endpoint.beneficiaries}?page=1&limit=100`;
