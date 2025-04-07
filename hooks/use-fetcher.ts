import { deleteFetcher, fetcher, postFetcher, putFetcher } from "@/api/fetcher";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";

export default function useFetcher(url: string, method = "post") {

  if (method === "get") {
    return useSWR(url, fetcher)
  } else if (method === "put") {
    return useSWRMutation(url, putFetcher)
  } else if (method === "delete") {
    return useSWR(url, deleteFetcher)
  }
  return useSWRMutation(url, postFetcher)
}