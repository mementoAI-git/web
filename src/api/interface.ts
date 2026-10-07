import type { AxiosRequestConfig } from "axios";

export interface IResponse<T = unknown> {
  message: string;
  success?: boolean;
  data?: T;
  status?: number;
  meta?: {
    contract_version?: string;
    request_id?: string;
    deprecations?: string[];
  };
}
export type Fetcher = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<IResponse>;

export type MutationFetcher = (
  input: string,
  body?: { arg: unknown },
) => Promise<IResponse>;

export interface ApiError {
  message: string;
  status?: number;
  httpStatus?: number;
  success?: false;
  code?: string;
  details?: Record<string, unknown>;
  request_id?: string;
  data?: unknown;
  errors?: unknown;
}

export interface RequestOptions extends AxiosRequestConfig {
  skipAuth?: boolean;
  skipErrorHandling?: boolean;
}

export interface ApiResponse<T = unknown> {
  success?: boolean;
  data: T;
  message?: string;
  status?: number;
}
