import { beforeEach, describe, expect, it, vi } from "vitest";
import { del, post } from "./mutations";
import { mutate } from "swr";
import { deleteMemory, restoreMemory, isMemoryCacheKey } from "./memory-lifecycle";
vi.mock("./mutations", () => ({ del: vi.fn(), post: vi.fn() }));
vi.mock("swr", () => ({ mutate: vi.fn().mockResolvedValue(undefined) }));
const memory = { _id: "m1", status: "save" };
beforeEach(() => vi.clearAllMocks());
describe("memory lifecycle requests", () => {
  it("sends the permanent deletion flag as a DELETE body", async () => {
    vi.mocked(del).mockResolvedValueOnce({ success: true, data: { ...memory, status: "deleted" } });
    await deleteMemory("m1", true);
    expect(del).toHaveBeenCalledWith("/memories/m1", { data: { delete_permanently: true } });
    expect(mutate).toHaveBeenCalled();
  });
  it("returns the restored memory and refreshes every affected list", async () => {
    vi.mocked(post).mockResolvedValueOnce({ success: true, data: memory });
    expect(await restoreMemory("m1")).toEqual(memory);
    expect(post).toHaveBeenCalledWith("/memories/m1/restore");
    expect(mutate).toHaveBeenCalledWith(isMemoryCacheKey);
  });
  it("never reports a failed response as a successful restore", async () => {
    vi.mocked(post).mockResolvedValueOnce({ success: false, data: null, message: "Recovery window expired" });
    await expect(restoreMemory("m1")).rejects.toThrow("Recovery window expired");
    expect(mutate).not.toHaveBeenCalled();
  });
  it.each(["/memories/stories?page=2&deleted=true", "$inf$/memories/stories?page=1", "/memories/stories?page=1&bookmarked=true", "/memories/stats", "/users/stats", "/memories/search?q=home"])("refreshes %s", (key) => expect(isMemoryCacheKey(key)).toBe(true));
  it("does not refresh unrelated endpoints", () => expect(isMemoryCacheKey("/billing/subscription")).toBe(false));
  it("does not mask a successful server write if refreshing fails", async () => {
    vi.mocked(post).mockResolvedValueOnce({ success: true, data: memory });
    vi.mocked(mutate).mockRejectedValueOnce(new Error("Offline"));
    expect(await restoreMemory("m1")).toEqual(memory);
  });
});
