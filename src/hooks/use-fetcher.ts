import endpoint from "@/api/endpoint";
import {
  deleteFetcher,
  fileUploadFetcher,
  getFetcher,
  postFetcher,
  putFetcher,
} from "@/api/fetcher";
import type { IResponse } from "@/api/interface";
import useSWR from "swr";
import useSWRMutation, { type SWRMutationConfiguration } from "swr/mutation";

const fetcherMap = {
  get: getFetcher,
  post: postFetcher,
  put: putFetcher,
  delete: deleteFetcher,
} as const;

export default function useFetcher(
  url: string,
  method: keyof typeof fetcherMap = "post",
  options?: SWRMutationConfiguration<IResponse, any>,
) {
  const fetcher = fetcherMap[method] || postFetcher;
  return useSWRMutation(url, fetcher, options);
}

export function useFileUploadFetcher(url: string = endpoint.upload) {
  return useSWRMutation<
    IResponse,
    unknown,
    string,
    { arg: any }
  >(url, fileUploadFetcher);
}

export function useUser() {
  return useSWR(endpoint.profile);
}



