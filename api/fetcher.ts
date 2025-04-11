"use client"

import Axios, { AxiosError } from "axios";
import { IResponse, MutationFetcher } from "./interface";
import { toast } from 'sonner';

const axios = Axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

axios.interceptors.request.use((config) => {
  const auth = localStorage.getItem("auth")

  if (auth) {
    const { access_token } = JSON.parse(auth)
    config.headers.Authorization = `Bearer ${access_token}`;
  }

  return config;
});

export const fetcher = (url: string) => handleRequest("get", url)

export const getFetcher: MutationFetcher = async (url, body) => handleRequest("get", url, body);

export const postFetcher: MutationFetcher = async (url, body) => {
  const result = await handleRequest("post", url, body)

  if (result?.data?.access_token) {
    localStorage.setItem("auth", JSON.stringify(result?.data))
  }
  return result
};

export const putFetcher: MutationFetcher = async (url, body) => handleRequest("put", url, body);

export const deleteFetcher: MutationFetcher = async (url, body) => handleRequest("delete", url, body);

export const fileUploadFetcher = async (url: string, { arg }) => {
  const { file, onProgress } = arg;
  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await axios.post(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        const percent = Math.round((event.loaded * 100) / event.total);
        onProgress(percent);
      },
    });

    toast.success(res.data?.message || "Success", { className: "!text-success" });
    return res.data;
  } catch (error) {
    let message = "Something went wrong";

    if (Axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<IResponse>;
      message = axiosError.response?.data?.message || axiosError.message;
      toast.error(message, { className: "!text-danger" });

      throw axiosError.response?.data || null
    }
    toast.error(message, { className: "!text-danger" });

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

    if (method !== "get") {
      toast.success(res.data?.message || "Success", { className: "!text-success" });
    }
    return res.data;
  } catch (error) {
    let message = "Something went wrong";

    if (Axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<IResponse>;
      message = axiosError.response?.data?.message || axiosError.message;

      if (method !== "get") {
        toast.error(message, { className: "!text-danger" });
      }

      throw axiosError.response?.data || null
    }

    if (method !== "get") {
      toast.error(message, { className: "!text-danger" });
    }
    throw { message };
  }
};