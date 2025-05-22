import endpoint from "@/api/endpoint";
import { deleteFetcher, getFetcher, postFetcher, putFetcher } from "@/api/fetcher";
import { IResponse } from "@/api/interface";
import useSWR from "swr";
import useSWRMutation, { SWRMutationConfiguration } from "swr/mutation";

const fetcherMap = {
  get: getFetcher,
  post: postFetcher,
  put: putFetcher,
  delete: deleteFetcher,
};

export default function useFetcher(
  url: string,
  method = "post",
  options?: SWRMutationConfiguration<IResponse, any>,
) {
  const fetcher = fetcherMap[method] || postFetcher;
  return useSWRMutation(url, fetcher, options);
}

export function useUser() {
  return useSWR(endpoint.profile)
}
