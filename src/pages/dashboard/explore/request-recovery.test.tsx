import { useEffect } from "react";
import { useStore } from "@/hooks/use-store";
import { mockUser } from "@/test/fixtures";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeAll, afterAll, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { Route, Routes } from "react-router-dom";
import { renderWithProviders } from "@/test";
import { server } from "@/test/mocks/server";
import { toast } from "sonner";
import { SearchMemoriesV2 } from "@/components/modal/memory/search/search-modal-v2";
import ExplorePage from "./index";
import ExploreCategoryPage from "./category";
import CategoryDetails from "./category-details";
import BrowseTopics from "../overview/sections/browse-topics";
import DailyPromptSection from "../overview/sections/daily-prompt-section";

vi.mock("@/hooks/use-intersection-observer", () => ({ default: () => true }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(() => "request"), dismiss: vi.fn(), success: vi.fn() } }));
beforeAll(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  Element.prototype.scrollIntoView = vi.fn();
});
afterAll(() => vi.unstubAllGlobals());
const base = "http://localhost:3000/api";
const category = { slug: "who-i-am", title: "Who I Am", description: "Identity", order: 0, starterTotal: 10 };

function SignedInSearch() {
  const { setUser } = useStore();
  useEffect(() => { setUser(mockUser); }, [setUser]);
  return <SearchMemoriesV2 />;
}

describe("Explore request recovery", () => {
  it.each([
    { name: "categories", path: "/prompts/categories", ui: <ExplorePage />, response: [category], recovered: "Who I Am" },
    { name: "topics", path: "/prompts/suggestions/overview", ui: <BrowseTopics />, response: [], recovered: "No topics available right now." },
    { name: "reflections", path: "/prompts", ui: <DailyPromptSection />, response: [], recovered: "No reflections available today. Explore more topics below." },
    { name: "category topics", path: "/prompts/categories/who-i-am", ui: <CategoryDetails category={category} />, response: { docs: [], hasNextPage: false, totalDocs: 0 }, recovered: "No prompts available for this category." },
  ])("retries $name after a failed request, without claiming an empty result", async ({ name, path, ui, response, recovered }) => {
    let failed = true;
    server.use(http.get(base + path, () => failed ? HttpResponse.json({ message: "offline" }, { status: 500 }) : HttpResponse.json({ data: response })));
    renderWithProviders(ui, { auth: true });
    const retry = await screen.findByRole("button", { name: `Retry loading ${name}` });
    expect(screen.queryByText(/No reflections available|No topics available|No prompts available/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Questions are temporarily unavailable/)).not.toBeInTheDocument();
    expect(toast.error).toHaveBeenCalled();
    failed = false;
    fireEvent.click(retry);
    await waitFor(() => expect(screen.queryByRole("button", { name: `Retry loading ${name}` })).not.toBeInTheDocument());
    expect(await screen.findByText(recovered)).toBeVisible();
  });

  it("retries search without clearing the query or showing an inline error", async () => {
    let failed = true;
    server.use(http.get(base + "/memories/search", () => failed ? HttpResponse.json({}, { status: 429 }) : HttpResponse.json({ data: { docs: [], search: { mode: "hybrid", preparing: false } } })));
    renderWithProviders(<SignedInSearch />, { auth: true });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "my holiday" } });
    const retry = await screen.findByRole("button", { name: "Retry search" });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByText("No memories found")).not.toBeInTheDocument();
    failed = false;
    fireEvent.click(retry);
    expect(await screen.findByText("No memories found")).toBeVisible();
    expect(screen.getByRole("combobox")).toHaveValue("my holiday");
  });

  it("recovers shuffle availability through a toast and retry", async () => {
    let failed = true;
    server.use(http.get(base + "/prompts/shuffle", () => failed ? HttpResponse.json({}, { status: 500 }) : HttpResponse.json({ data: { remaining: 2, used: 0 } })));
    renderWithProviders(<DailyPromptSection />, { auth: true });
    const retry = await screen.findByRole("button", { name: "Retry shuffle availability" });
    expect(screen.queryByText("Shuffle is temporarily unavailable.")).not.toBeInTheDocument();
    failed = false;
    fireEvent.click(retry);
    expect(await screen.findByText("2 shuffles left today")).toBeVisible();
  });

  it("retains earlier topics and stops automatic pagination after a next-page failure", async () => {
    let failed = true;
    let failedRequests = 0;
    server.use(http.get(base + "/prompts/categories/who-i-am", ({ request }) => {
      const page = Number(new URL(request.url).searchParams.get("page"));
      if (page === 2 && failed) {
        failedRequests++;
        return HttpResponse.json({}, { status: 500 });
      }
      return HttpResponse.json({ data: { docs: [{ _id: `topic-${page}`, title: `Question on page ${page}` }], totalDocs: 2, hasNextPage: page === 1 } });
    }));
    renderWithProviders(<CategoryDetails category={category} />, { auth: true });
    const retry = await screen.findByRole("button", { name: "Retry loading category topics" });
    expect(screen.getByText("Question on page 1")).toBeVisible();
    expect(failedRequests).toBe(1);
    failed = false;
    fireEvent.click(retry);
    expect(await screen.findByText("Question on page 2")).toBeVisible();
    expect(screen.getAllByText("Question on page 1")).toHaveLength(1);
  });

  it("keeps the category route open and retries its catalog", async () => {
    let failed = true;
    server.use(http.get(base + "/prompts/categories/who-i-am", () => HttpResponse.json({ data: { docs: [], hasNextPage: false } })));
    server.use(http.get(base + "/prompts/categories", () => failed ? HttpResponse.json({}, { status: 500 }) : HttpResponse.json({ data: [category] })));
    renderWithProviders(<Routes><Route path="/explore/categories/:id" element={<ExploreCategoryPage />} /></Routes>, { route: "/explore/categories/who-i-am", auth: true });
    const retry = await screen.findByRole("button", { name: "Retry loading categories" });
    expect(screen.queryByText(/Questions are temporarily unavailable/)).not.toBeInTheDocument();
    failed = false;
    fireEvent.click(retry);
    expect(await screen.findByRole("heading", { name: "Who I Am" })).toBeVisible();
  });
});
