import endpoint from "@/api/endpoint";
import { deleteFetcher, getFetcher, postFetcher, putFetcher } from "@/api/fetcher";
import { IResponse } from "@/api/interface";
import useSWR from "swr";
import useSWRMutation, { SWRMutationConfiguration } from "swr/mutation";

export default function useFetcher(
  url: string,
  method = "post",
  options?: SWRMutationConfiguration<IResponse, any>,
) {
  if (method === "get") {
    return useSWRMutation(url, getFetcher, options);
  } else if (method === "put") {
    return useSWRMutation(url, putFetcher, options);
  } else if (method === "delete") {
    return useSWRMutation(url, deleteFetcher, options);
  }
  return useSWRMutation(url, postFetcher, options)
}

export function useUser() {
  return useSWR(endpoint.profile)
}
