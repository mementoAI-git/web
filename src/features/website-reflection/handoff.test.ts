import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  captureWebsiteReflection,
  clearWebsiteReflection,
  getWebsiteReflection,
  reflectionDayKey,
} from "./handoff";
import { syncWebsiteReflection } from "./sync";

vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));
vi.mock("swr", () => ({ mutate: vi.fn(() => Promise.resolve()) }));
vi.mock("@/api/fetcher", () => ({ postFetcher: vi.fn() }));

const handoff = (extra = "") =>
  ({
    pathname: "/register",
    hash: "",
    search: `?source=website-hero-reply&reflection_topic=People+I+love&reflection_question=Where+did+he+like+to+go%3F&reflection_answer=The+coast+road.${extra}`,
  }) as Pick<Location, "search" | "pathname" | "hash">;

describe("website reflection handoff", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("keeps the reply from the register link and removes it from the address bar", () => {
    const replace = vi.spyOn(window.history, "replaceState");
    captureWebsiteReflection(handoff("&ref=abc"));
    expect(getWebsiteReflection()).toMatchObject({ question: "Where did he like to go?", answer: "The coast road.", topic: "People I love", attempts: 0 });
    expect(replace.mock.calls[0]?.[2]).toBe("/register?ref=abc");
  });

  it("ignores links that are not from the website reply, or are empty or too long", () => {
    captureWebsiteReflection({ pathname: "/register", hash: "", search: "?reflection_answer=hi&reflection_question=q" });
    expect(getWebsiteReflection()).toBeUndefined();
    captureWebsiteReflection({ pathname: "/register", hash: "", search: "?source=website-hero-reply&reflection_question=q&reflection_answer=" });
    expect(getWebsiteReflection()).toBeUndefined();
    captureWebsiteReflection({ pathname: "/register", hash: "", search: `?source=website-hero-reply&reflection_question=${"q".repeat(501)}&reflection_answer=a` });
    expect(getWebsiteReflection()).toBeUndefined();
  });

  it("expires after two weeks", () => {
    captureWebsiteReflection(handoff());
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 15 * 86400000);
    expect(getWebsiteReflection()).toBeUndefined();
  });

  it("saves it once as a reflection for the signed-in user, then clears it", async () => {
    captureWebsiteReflection(handoff());
    const save = vi.fn().mockResolvedValue({ success: true });
    expect(await syncWebsiteReflection(save)).toBe(true);
    expect(save).toHaveBeenCalledWith("/memories/quick-capture", {
      arg: {
        body: "<p>The coast road.</p>",
        prompt_type: "ai-generated",
        prompt_text: "Where did he like to go?",
        reflection_day_key: reflectionDayKey(Date.now()),
      },
    });
    expect(getWebsiteReflection()).toBeUndefined();
    expect(await syncWebsiteReflection(save)).toBe(false);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("keeps it after a failed save and gives up after three tries", async () => {
    captureWebsiteReflection(handoff());
    const save = vi.fn().mockRejectedValue(new Error("offline"));
    for (let i = 0; i < 3; i++) expect(await syncWebsiteReflection(save)).toBe(false);
    expect(getWebsiteReflection()?.attempts).toBe(3);
    await syncWebsiteReflection(save);
    expect(save).toHaveBeenCalledTimes(3);
    expect(getWebsiteReflection()).toBeUndefined();
    clearWebsiteReflection();
  });
});
