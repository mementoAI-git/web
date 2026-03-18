import endpoint from "./endpoint";
import { post, get } from "./mutations";
import type {
  OnboardingState,
  AgeBand,
  MementoFor,
  PassionKey,
  DimensionKey,
  ExpressionMode,
} from "@/features/onboarding-groot/types";

// --- API types (users module) ---

export type OnboardingStatus = "never" | "skipped" | "completed";

export interface OnboardingDetailsUser {
  first_name: string;
  last_name: string;
  nickname: string;
  full_name: string;
  age_range: string;
  location: string;
}

export interface OnboardingDetailsPersona {
  join_reasons: string[];
  audience: string[];
  current_priority: string[];
  communication_style: string[];
  prefered_communication_style: string;
}

export interface OnboardingDetailsResponse {
  onboarding_status: OnboardingStatus;
  user: OnboardingDetailsUser;
  persona: OnboardingDetailsPersona;
}

export interface SaveOnboardingApiBody {
  first_name?: string;
  last_name?: string;
  nickname?: string;
  age_range?: string;
  location?: string;
  step?: number;
  join_reasons?: string[];
  audience?: string[];
  current_priority?: string[];
  prefered_communication_style?: string;
}

/** Frontend payload: same shape as before for callers */
export interface SaveOnboardingBody {
  fullName: string;
  displayName: string;
  ageBand: string;
  whereFrom?: string;
  mementoFor: string[];
  mementoForFreetext?: string;
  passions: string[];
  passionsFreetext?: string;
  lifeContext: string[];
  motivationType: string;
  priorityDimensions: string[];
  dimensionsFreetext?: string;
  expressionMode: string[];
  isComplete: boolean;
  stepReached: number;
}

const PASSION_KEYS: readonly PassionKey[] = [
  "food_cooking",
  "travel_places",
  "faith_spirituality",
  "music",
  "sports_fitness",
  "reading_learning",
  "nature_outdoors",
  "art_creativity",
  "family_history_heritage",
  "business_entrepreneurship",
  "community_service",
  "technology",
  "something_else",
] as const;

function isPassionKey(s: string): s is PassionKey {
  return (PASSION_KEYS as readonly string[]).includes(s);
}

/** Map frontend state to API POST /users/onboarding body */
function mapStateToApiBody(body: SaveOnboardingBody): SaveOnboardingApiBody {
  const parts = body.fullName.trim().split(/\s+/);
  const first_name = parts[0] ?? "";
  const last_name = parts.slice(1).join(" ") ?? "";
  const join_reasons = [
    ...body.passions,
    ...(body.passionsFreetext?.trim() ? [body.passionsFreetext.trim()] : []),
  ];
  const audience = [
    ...body.mementoFor,
    ...(body.mementoForFreetext?.trim() ? [body.mementoForFreetext.trim()] : []),
  ];
  const current_priority = [
    ...body.priorityDimensions,
    ...(body.dimensionsFreetext?.trim() ? [body.dimensionsFreetext.trim()] : []),
  ];
  return {
    first_name: first_name || undefined,
    last_name: last_name || undefined,
    nickname: body.displayName?.trim() || undefined,
    age_range: body.ageBand?.trim() || undefined,
    location: body.whereFrom?.trim() || undefined,
    step: body.stepReached ?? 8,
    join_reasons: join_reasons.length ? join_reasons : undefined,
    audience: audience.length ? audience : undefined,
    current_priority: current_priority.length ? current_priority : undefined,
    prefered_communication_style:
      body.expressionMode?.[0]?.trim() || undefined,
  };
}

/** Save onboarding on completion. POST /users/onboarding */
export async function saveOnboarding(
  body: SaveOnboardingBody
): Promise<{ success: boolean }> {
  try {
    const apiBody = mapStateToApiBody(body);
    const res = await post<unknown>(endpoint.onboarding, apiBody);
    const status = (res as { status?: number })?.status;
    return { success: status === 200 };
  } catch {
    return { success: false };
  }
}

/** Map API onboarding-details response to Partial<OnboardingState> for prefill */
export function mapOnboardingDetailsToState(
  data: OnboardingDetailsResponse
): Partial<OnboardingState> {
  const { user, persona } = data;
  const joinReasons = persona.join_reasons ?? [];
  const passions: PassionKey[] = [];
  const otherReasons: string[] = [];
  for (const r of joinReasons) {
    if (isPassionKey(r)) passions.push(r);
    else otherReasons.push(r);
  }
  const fullName =
    (user.full_name?.trim()) ||
    [user.first_name, user.last_name].filter(Boolean).join(" ");
  return {
    fullName,
    displayName: user.nickname ?? "",
    ageBand: (user.age_range as AgeBand) || null,
    whereFrom: user.location ?? "",
    mementoFor: (persona.audience ?? []) as MementoFor[],
    passions,
    passionsFreetext: otherReasons.join(", "),
    priorityDimensions: (persona.current_priority ?? []) as DimensionKey[],
    expressionMode: persona.prefered_communication_style
      ? ([persona.prefered_communication_style] as ExpressionMode[])
      : [],
    isRevisitMode: true,
  };
}

/** Fetch onboarding data for revisit/prefill. GET /users/onboarding-details */
export async function fetchOnboardingDetails(): Promise<OnboardingDetailsResponse | null> {
  try {
    const res = await get<OnboardingDetailsResponse>(endpoint.onboardingDetails);
    const data = (res as { data?: OnboardingDetailsResponse })?.data;
    return data ?? null;
  } catch {
    return null;
  }
}

/** Skip onboarding. POST /users/onboarding/skip */
export async function skipOnboarding(): Promise<{
  success: boolean;
  onboarding_status?: OnboardingStatus;
}> {
  try {
    const res = await post<{ onboarding_status?: OnboardingStatus }>(
      endpoint.onboardingSkip
    );
    const data = (res as { data?: { onboarding_status?: OnboardingStatus }; status?: number })
      ?.data;
    const status = (res as { status?: number })?.status;
    return {
      success: status === 200,
      onboarding_status: data?.onboarding_status,
    };
  } catch {
    return { success: false };
  }
}
