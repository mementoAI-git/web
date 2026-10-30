import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetcher } from "./fetcher";
import { fetchMemorySearch } from "./memory-search";

vi.mock("./fetcher", () => ({ fetcher: vi.fn() }));
const response = {
  message: "OK",
  data: { docs: [{ _id: "story-1", type: "story" }] },
};

beforeEach(() => vi.mocked(fetcher).mockReset());

describe("memory search server compatibility", () => {
  it("uses description search when the backend supports it", async () => {
    const hybrid = {
      ...response,
      data: { ...response.data, search: { mode: "hybrid", preparing: false } },
    };
    vi.mocked(fetcher).mockResolvedValueOnce(hybrid);
    expect(await fetchMemorySearch("/memories/search?q=first%20home")).toEqual(
      hybrid,
    );
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it.each([404, 405, 500, 502, 503])(
    "uses truthful word search when the new endpoint returns %s",
    async (status) => {
      vi.mocked(fetcher)
        .mockRejectedValueOnce({ httpStatus: status })
        .mockResolvedValueOnce(response);
      const result = await fetchMemorySearch(
        "/memories/search?q=first%20home%20%26%20family",
      );
      const fallback = new URL(
        String(vi.mocked(fetcher).mock.calls[1][0]),
        "https://example.test",
      );
      expect(fallback.pathname).toBe("/memories");
      expect(fallback.searchParams.get("search")).toBe("first home & family");
      expect(fallback.searchParams.get("limit")).toBe("20");
      expect(result.data?.docs).toEqual(response.data.docs);
      expect(result.data?.search).toEqual({
        mode: "keyword",
        preparing: false,
      });
    },
  );

  it.each([401, 403, 422, 429])(
    "preserves authentication, validation and rate-limit errors (%s)",
    async (status) => {
      const error = { httpStatus: status };
      vi.mocked(fetcher).mockRejectedValueOnce(error);
      await expect(fetchMemorySearch("/memories/search?q=home")).rejects.toBe(
        error,
      );
      expect(fetcher).toHaveBeenCalledTimes(1);
    },
  );

  it("surfaces failure when word search also fails", async () => {
    const error = { httpStatus: 503 };
    vi.mocked(fetcher)
      .mockRejectedValueOnce({ httpStatus: 500 })
      .mockRejectedValueOnce(error);
    await expect(fetchMemorySearch("/memories/search?q=home")).rejects.toBe(
      error,
    );
  });
});
