/**
 * Pinned subset of the canonical Memento API contract used by the web client.
 * Source artifact checksum: API release 2026-08.
 */
export const MEMENTO_OPENAPI_SHA256 =
  "8b112db013ea4328bd72c9020e063f62d5ad04378969cf29855c1d4c01403536";

export interface GeneratedPublicUser {
  id: string;
  _id: string;
  email?: string;
  fullname: string | null;
  onboarding_status: string;
  onboarded: boolean;
  [key: string]: unknown;
}

export interface GeneratedSessionPayload {
  access_token: string;
  refresh_token: string;
  access_expires_at: string;
  expires_at: string;
  refresh_expires_at: string;
  onboarding_status: string;
  user?: GeneratedPublicUser;
}

export interface GeneratedApiResponse<T> {
  status: number;
  success: true;
  message: string;
  data: T;
  meta?: {
    contract_version: string;
    request_id: string;
    deprecations?: string[];
  };
}

export interface GeneratedApiError {
  status: number;
  success: false;
  message: string;
  code?: string;
  details?: Record<string, unknown>;
  request_id?: string;
}
