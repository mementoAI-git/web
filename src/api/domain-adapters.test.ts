import { describe, expect, it } from "vitest";
import {
  normalizeCollectionResponse,
  normalizeEntityResponse,
  normalizePaginatedResponse,
} from "./domain-adapters";

describe("domain response adapters", () => {
  it("preserves a canonical paginated envelope", () => {
    const response = normalizePaginatedResponse<{ _id: string }>({
      success: true,
      message: "ok",
      data: {
        docs: [{ _id: "one" }],
        page: 2,
        limit: 10,
        totalDocs: 11,
        totalPages: 2,
        hasNextPage: false,
        hasPrevPage: true,
        nextPage: null,
        prevPage: 1,
        pagingCounter: 11,
      },
    });

    expect(response.data.docs).toEqual([{ _id: "one" }]);
    expect(response.data.page).toBe(2);
    expect(response.message).toBe("ok");
  });

  it("adapts direct and non-paginated legacy lists", () => {
    expect(
      normalizePaginatedResponse<{ _id: string }>([{ _id: "legacy" }], {
        page: 3,
        limit: 25,
      }).data,
    ).toMatchObject({
      docs: [{ _id: "legacy" }],
      page: 3,
      limit: 25,
      totalDocs: 1,
      hasNextPage: false,
    });
  });

  it("normalizes collection endpoints from arrays or pagination", () => {
    expect(normalizeCollectionResponse<string>({ data: ["a", "b"] }).data).toEqual(["a", "b"]);
    expect(
      normalizeCollectionResponse<string>({ data: { docs: ["c"] } }).data,
    ).toEqual(["c"]);
  });

  it("unwraps one legacy nested data layer for entity endpoints", () => {
    expect(
      normalizeEntityResponse<{ current_priority: string }>({
        data: { data: { current_priority: "family" } },
      }).data,
    ).toEqual({ current_priority: "family" });
  });
});
