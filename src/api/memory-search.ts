import type { IMemory } from "@/utility/interface";
import endpoint from "./endpoint";
import { fetcher } from "./fetcher";
import type { ApiError, IResponse } from "./interface";

export interface MemorySearchData {
  docs: IMemory[];
  search?: {
    mode: "hybrid" | "keyword";
    preparing: boolean;
    limited?: boolean;
  };
}

/** Keep the app usable while the description-search backend is rolling out. */
export async function fetchMemorySearch(
  url: string,
): Promise<IResponse<MemorySearchData>> {
  try {
    return await fetcher<MemorySearchData>(url);
  } catch (error) {
    const apiError = error as ApiError;
    const status = apiError?.httpStatus ?? apiError?.status;
    // Preserve auth, validation and rate-limit errors without a second request.
    if (![404, 405, 410, 500, 501, 502, 503, 504].includes(status ?? 0))
      throw error;
    const query =
      new URL(url, "https://memento.invalid").searchParams.get("q") || "";
    const response = await fetcher<MemorySearchData>(
      `${endpoint.memories}?search=${encodeURIComponent(query)}&limit=20`,
    );
    const data = response.data;
    if (!data || !Array.isArray(data.docs))
      throw new Error("Search returned an invalid response");
    return {
      ...response,
      data: { ...data, search: { mode: "keyword", preparing: false } },
    };
  }
}
