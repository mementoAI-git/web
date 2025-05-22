"use client";

import Axios, { AxiosError } from "axios";
import { IResponse, MutationFetcher } from "./interface";
import { toast } from "sonner";
import { isEmpty } from "@/utility";

const axios = Axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

axios.interceptors.request.use((config) => {
  const auth = localStorage.getItem("auth");

  if (auth) {
    const { access_token } = JSON.parse(auth);
    config.headers.Authorization = `Bearer ${access_token}`;
  }

  return config;
});

export const fetcher = (url: string) => {
  return handleRequest("get", url);
}

export const getFetcher: MutationFetcher = async (url, body) => {
  return handleRequest("get", url, body);
}

export const postFetcher: MutationFetcher = async (url, body) => {
  const result = await handleRequest("post", url, body);

  if (result?.data?.access_token) {
    localStorage.setItem("auth", JSON.stringify(result?.data));
  }
  return result;
};

export const putFetcher: MutationFetcher = async (url, body) => {
  return handleRequest("put", url, body);
}

export const deleteFetcher: MutationFetcher = async (url, body) => {
  return handleRequest("delete", `${url}/${body.arg}`);
}

export const fileUploadFetcher = async (url: string, { arg }) => {
  const { file, onProgress, ...payload } = arg;
  const formData = new FormData();
  if (file) {
    formData.append("file", file, file.name);
  }

  if (!isEmpty(payload)) {
    Object.entries(payload).forEach(([key, value]) =>
      formData.append(key, String(value)),
    );
  }

  try {
    const res = await axios.post(url, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (event) => {
        if (onProgress) {
          const percent = Math.round((event.loaded * 100) / event.total);
          onProgress(percent);
        }
      },
    });

    res.data.success = true
    toast.success(res.data?.message || "Success");
    return res.data;
  } catch (error) {
    console.log(error)
    let message = "Something went wrong";

    if (Axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<IResponse>;
      message = axiosError.response?.data?.message || axiosError.message;
      toast.error(message);

      throw axiosError.response?.data || null;
    }
    toast.error(message);

    throw { message };
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

    res.data.success = true
    return res.data;
  } catch (error) {
    let message = "Something went wrong";

    if (Axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<IResponse>;
      message = axiosError.response?.data?.message || axiosError.message;

      if (method !== "get") {
        toast.error(message);
      }

      axiosError.response.data.success = false
      throw axiosError.response?.data || { success: false };
    }

    if (method !== "get") {
      toast.error(message);
    }
    throw { message, success: false };
  }
};
