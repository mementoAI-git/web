import type { AxiosRequestConfig } from "axios";

export interface IResponse {
  message: string;
  success?: boolean;
  data?: any;
  status?: number;
}
export type Fetcher = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<IResponse>;

export type MutationFetcher = (
  input: string,
  body?: { arg: any },
) => Promise<IResponse>;

export interface ApiError {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
}

export interface RequestOptions extends AxiosRequestConfig {
  skipAuth?: boolean;
  skipErrorHandling?: boolean;
}

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status?: number;
}
