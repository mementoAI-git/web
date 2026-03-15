/**
 * Host Onboarding (Groot) API client.
 * Backend endpoints are not yet implemented - these will 404 until backend is ready.
 * @see docs/ONBOARDING-GROOT-IMPLEMENTATION-PLAN.md
 */

import endpoint from "./endpoint";
import { post, patch, get } from "./mutations";
import type { DimensionKey } from "@/features/onboarding-groot";

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

export interface SaveOnboardingResponse {
  success: boolean;
  enrichmentScoreSeed?: Record<DimensionKey, number>;
}

export interface SaveProgressBody {
  stepReached: number;
  fullName?: string;
  displayName?: string;
  ageBand?: string;
  whereFrom?: string;
  mementoFor?: string[];
  mementoForFreetext?: string;
  passions?: string[];
  passionsFreetext?: string;
  lifeContext?: string[];
  motivationType?: string;
  priorityDimensions?: string[];
  dimensionsFreetext?: string;
  expressionMode?: string[];
}

/** Save onboarding data on completion. Backend: POST /host/onboarding */
export async function saveOnboarding(
  body: SaveOnboardingBody
): Promise<SaveOnboardingResponse> {
  try {
    const res = await post<{ data?: SaveOnboardingResponse }>(
      endpoint.hostOnboarding,
      body
    );
    const data = (res as { data?: SaveOnboardingResponse })?.data;
    return data ?? { success: true };
  } catch {
    return { success: true };
  }
}

/** Save step progress on each advance. Backend: PATCH /host/onboarding/progress */
export async function saveOnboardingProgress(
  body: SaveProgressBody
): Promise<{ success: boolean }> {
  try {
    const res = await patch<{ data?: { success: boolean } }>(
      endpoint.hostOnboardingProgress,
      body
    );
    const data = (res as { data?: { success: boolean } })?.data;
    return data ?? { success: true };
  } catch {
    return { success: true };
  }
}

/** Fetch host profile for revisit mode. Backend: GET /host/profile (or /users/profile with extended fields) */
export async function fetchHostProfile(): Promise<Record<string, unknown>> {
  try {
    const res = await get<Record<string, unknown>>(endpoint.hostProfile);
    return (res as { data?: Record<string, unknown> })?.data ?? {};
  } catch {
    return {};
  }
}
