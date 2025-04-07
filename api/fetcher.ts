import axios, { AxiosError } from "axios";
import { IResponse, MutationFetcher } from "./interface";
import { toast } from 'sonner';

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL

export const fetcher = (url: string) => handleRequest("get", url)

export const getFetcher: MutationFetcher = async (url, body) => handleRequest("get", url, body);

export const postFetcher: MutationFetcher = (url, body) => handleRequest("post", url, body);

export const putFetcher: MutationFetcher = async (url, body) => handleRequest("put", url, body);

export const deleteFetcher: MutationFetcher = async (url, body) => handleRequest("delete", url, body);

const handleRequest = async (method: string, url: string, body?: any) => {
  try {
    const res = await axios({
      method,
      baseURL,
      url,
      data: method === "get" ? {} : body?.arg,
      params: method === "get" ? body.arg : {},
      headers: { "Content-Type": "application/json" },
    });

    if (method !== "get") {
      toast.success(res.data?.message || "Success", { className: "!text-success" });
    }
    return res.data;
  } catch (error) {
    let message = "Something went wrong";

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<IResponse>;
      message = axiosError.response?.data?.message || axiosError.message;

      if (method !== "get") {
        toast.error(message, { className: "!text-danger" });
      }

      throw axiosError.response?.data || { message };
    }

    if (method !== "get") {
      toast.error(message, { className: "!text-danger" });
    }
    throw { message };
  }
};