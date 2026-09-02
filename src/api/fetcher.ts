"use client";

import Axios, { AxiosError, type AxiosRequestConfig } from "axios";
import type { IResponse, MutationFetcher } from "./interface";
import { toast } from "sonner";
import { isEmpty } from "@/utility";
import { storageKeys } from "@/utility/constant";
import { authService } from "@/utility/auth-service";
import {
  notifySubscriptionGate,
  parseSubscriptionGateFromBody,
} from "@/features/pricing/subscription-errors";
import endpoint from "./endpoint";
import { getMementoClientHeaders } from "./client-metadata";
import {
  extractSession,
  normalizeApiError,
  normalizeApiResponse,
} from "./contract-adapter";

const baseURL = import.meta.env.VITE_API_BASE_URL;

const axios = Axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
    ...getMementoClientHeaders(),
  },
});

function readAuthFromStorage(): { access_token?: string } | null {
  try {
    const raw = localStorage.getItem(storageKeys.auth);
    if (!raw) return null;
    return JSON.parse(raw) as { access_token?: string };
  } catch {
    return null;
  }
}

axios.interceptors.request.use((config) => {
  const auth = readAuthFromStorage();
  if (auth?.access_token) {
    const { access_token } = auth;
    config.headers.Authorization = `Bearer ${access_token}`;
  }

  return config;
});

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const authData = authService.getAuthData();

        if (authData && !authService.isRefreshTokenExpired(authData)) {
          const newAuthData = await authService.refreshAccessToken();

          originalRequest.headers.Authorization = `Bearer ${newAuthData.access_token}`;

          return axios(originalRequest);
        } else {
          authService.redirectToLoginWithPath();
        }
      } catch {
        authService.redirectToLoginWithPath();
      }
    }

    return Promise.reject(error);
  },
);

export const fetcher = <T = unknown>(url: string): Promise<IResponse<T>> => {
  return handleRequest<T>("get", url);
};

export const getFetcher: MutationFetcher = async (url, body) => {
  return handleRequest("get", url, body);
};

export const postFetcher: MutationFetcher = async (url, body) => {
  const result = await handleRequest("post", url, body);

  const session = extractSession(result);
  if (session) {
    authService.setAuthData(session);
  }
  return result;
};

export const putFetcher: MutationFetcher = async (url, body) => {
  return handleRequest("put", url, body);
};

export const deleteFetcher: MutationFetcher = async (url, body = { arg: {} }) => {
  return handleRequest("delete", url, body);
};

export const fileUploadFetcher = async (url: string, { arg }: { arg: Record<string, unknown> & { file?: File; onProgress?: (p: number) => void } }) => {
  const { file, onProgress, ...payload } = arg;
  const formData = new FormData();
  if (file) {
    formData.append("file", file, file.name);
  }

  if (!isEmpty(payload)) {
    Object.entries(payload).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => formData.append(key, String(v)));
      } else {
        formData.append(key, String(value));
      }
    });
  }

  try {
    const config: AxiosRequestConfig = {
      // Prevent automatic JSON transformation of FormData
      transformRequest: [
        (data: unknown, headers: Record<string, unknown>) => {
          if (typeof FormData !== "undefined" && data instanceof FormData) {
            // Let browser handle multipart encoding
            // @ts-expect-error - headers might be a custom type
            if (typeof headers.setContentType === "function") {
              // @ts-expect-error - headers might be a custom type
              headers.setContentType(undefined);
            }
          }
          return data;
        },
      ],
    };

    if (onProgress) {
      config.onUploadProgress = (event: AxiosProgressEvent) => {
        if (event.total) {
          const percent = Math.round((event.loaded * 80) / event.total);
          onProgress(percent);
        }
      };
    }

    const res = await axios.post(url, formData, config);

    if (res.status === 200 && onProgress) {
      onProgress(100);
    }

    return {
      success: true,
      data: res.data.data,
      message: res.data.message,
    };
  } catch (error) {
    let message = "Something went wrong";

    if (Axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<IResponse>;
      const status = axiosError.response?.status;
      const data = axiosError.response?.data;

      if ((status === 402 || status === 403) && data && typeof data === "object") {
        const gate = parseSubscriptionGateFromBody(data);
        if (gate) {
          notifySubscriptionGate(gate);
          message =
            typeof (data as IResponse).message === "string" ?
              (data as IResponse).message!
            : "Upgrade to continue uploading.";
          return {
            success: false,
            data: null,
            message,
            subscriptionGate: true as const,
          };
        }
      }

      message = axiosError.response?.data?.message || axiosError.message;

      toast.error(message);

      return {
        success: false,
        data: null,
        message,
      };
    }
    toast.error(message);

    return { success: false, data: null, message };
  }
};

export const streamlineFetcher = async (url: string, { arg }: { arg: Record<string, unknown> & { onChunk: (chunk: string) => void; onMeta?: (meta: { model?: string }) => void; signal?: AbortSignal } }) => {
  const { onChunk, onMeta, signal, ...payload } = arg;
  const auth = readAuthFromStorage();

  const response = await fetch(`${baseURL}${url}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getMementoClientHeaders(),
      Authorization: `Bearer ${auth?.access_token}`,
    },
    signal,
    body: JSON.stringify(payload),
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder("utf-8");
  const modelFromHeader = response.headers.get("x-ai-model") || undefined;
  onMeta?.({ model: modelFromHeader });

  if (response.ok && reader) {
    while (true) {
      const { value, done } = await reader.read();
      if (value !== undefined && value.byteLength > 0) {
        onChunk(decoder.decode(value, { stream: true }));
      }
      if (done) {
        onChunk(decoder.decode());
        break;
      }
    }
  } else {
    const data = await response.json().catch(() => null);
    toast.error(data?.message || "Something went wrong, try again");
  }
};

/**
 * POST JSON without surfacing error toasts (e.g. background offline queue sync).
 * Returns whether the server responded with a successful payload.
 */
export async function postJsonQuiet(url: string, body: unknown): Promise<boolean> {
  try {
    const res = await axios.post(url, body, {
      headers: { "Content-Type": "application/json" },
    });
    const payload = res.data as { status?: number; success?: boolean } | undefined;
    if (res.status !== 200) return false;
    if (payload?.success === false) return false;
    if (typeof payload?.status === "number" && payload.status >= 400) return false;
    return true;
  } catch {
    return false;
  }
}

/** Transcription: no error toasts (Quick Capture voice notes). */
export async function postTranscribeQuiet(file_id: string): Promise<{ full_text?: string } | null> {
  try {
    const res = await axios.post(
      endpoint.transcription,
      { file_id },
      { headers: { "Content-Type": "application/json" } },
    );
    if (res.status !== 200) return null;
    const payload = res.data as { success?: boolean; data?: { full_text?: string } } | undefined;
    if (payload?.success === false) return null;
    return payload?.data ?? null;
  } catch {
    return null;
  }
}

const handleRequest = async <T = unknown>(
  method: string,
  url: string,
  body?: { arg?: unknown },
): Promise<IResponse<T>> => {
  try {
    const res = await axios({
      method,
      url,
      data: method === "get" ? {} : body?.arg,
      params: method === "get" ? body?.arg : {},
      headers: { "Content-Type": "application/json" },
    });

    return normalizeApiResponse<T>(res.data);
  } catch (error) {
    let message = "Something went wrong";

    if (Axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<IResponse>;
      message = axiosError.response?.data?.message || axiosError.message;

      if (method !== "get") {
        toast.error(message);
      }

      throw normalizeApiError(
        axiosError.response?.data,
        axiosError.response?.status,
        message,
      );
    }

    if (method !== "get") {
      toast.error(message);
    }
    throw normalizeApiError(null, undefined, message);
  }
};
