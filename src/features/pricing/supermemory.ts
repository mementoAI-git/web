/**
 * Supermemory (PRD §6.4): backend sync checks tier before writes; free users should not
 * see hard failures for normal chat. When a user-facing Supermemory **action** ships,
 * add its API path here and handle 402 via `handleSubscriptionGateError`.
 */
export const SUPERMEMORY_DEPENDENT_API_PATHS: readonly string[] = [];
