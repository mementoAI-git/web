"use client";

import Axios, { AxiosError } from "axios";
import type { IResponse, MutationFetcher } from "./interface";
import { toast } from "sonner";
import { isEmpty } from "@/utility";
import { storageKeys } from "@/utility/constant";
import { authService } from "@/utility/auth-service";

const baseURL = import.meta.env.VITE_API_BASE_URL;

const axios = Axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

axios.interceptors.request.use((config) => {
  const auth = localStorage.getItem(storageKeys.auth);

  if (auth) {
    const { access_token } = JSON.parse(auth);
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

export const fetcher = (url: string) => {
  return handleRequest("get", url);
};

export const getFetcher: MutationFetcher = async (url, body) => {
  return handleRequest("get", url, body);
};

export const postFetcher: MutationFetcher = async (url, body) => {
  const result = await handleRequest("post", url, body);

  if (result?.data?.access_token) {
    authService.setAuthData(result?.data);
  }
  return result;
};

export const putFetcher: MutationFetcher = async (url, body) => {
  return handleRequest("put", url, body);
};

export const deleteFetcher: MutationFetcher = async (url, body) => {
  return handleRequest("delete", url, body);
};

export const fileUploadFetcher = async (url: string, { arg }: any) => {
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
    const res = await axios.post(url, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (event) => {
        if (onProgress && event.total) {
          const percent = Math.round((event.loaded * 80) / event.total);
          onProgress(percent);
        }
      },
    });

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

export const streamlineFetcher = async (url: string, { arg }: any) => {
  const { onChunk, signal, ...payload } = arg;
  const storedAuth = localStorage.getItem(storageKeys.auth);
  const auth = storedAuth ? JSON.parse(storedAuth) : null;

  const response = await fetch(`${baseURL}${url}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${auth?.access_token}`,
    },
    signal,
    body: JSON.stringify(payload),
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder("utf-8");
  let is_done = false;

  if (response.ok && reader) {
    while (!is_done) {
      const { value, done } = await reader.read();
      if (done) is_done = true;

      const chunk = decoder.decode(value, { stream: true });
      onChunk(chunk);
    }
  } else {
    const data = await response.json().catch(() => null);
    toast.error(data?.message || "Something went wrong, try again");
  }
};

const handleRequest = async (method: string, url: string, body?: any) => {
  try {
    const res = await axios({
      method,
      url,
      data: method === "get" ? {} : body?.arg,
      params: method === "get" ? body?.arg : {},
      headers: { "Content-Type": "application/json" },
    });

    res.data.success = true;
    return res.data;
  } catch (error) {
    let message = "Something went wrong";

    if (Axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<IResponse>;
      message = axiosError.response?.data?.message || axiosError.message;

      if (method !== "get") {
        toast.error(message);
      }

      const data = axiosError.response?.data || { success: false };
      data.success = false;
      throw data;
    }

    if (method !== "get") {
      toast.error(message);
    }
    throw { message, success: false };
  }
};

