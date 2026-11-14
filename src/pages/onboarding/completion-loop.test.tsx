import { createMockUser, mockAuth } from "@/test/fixtures";
import { seedAuth } from "@/test/auth-helpers";
import endpoint from "@/api/endpoint";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom";
import { SWRConfig } from "swr";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StoreProvider } from "@/hooks/use-store";
import AuthCheck from "@/components/layouts/auth-check";
import OnboardingGuard from "@/components/layouts/onboarding-guard";
import SummaryPage from "./summary";
import { useSkipOnboarding } from "./use-skip-onboarding";

vi.mock("@/lib/posthog", () => ({ default: { __loaded: false, capture: vi.fn() } }));
const { fetcher, postFetcher } = vi.hoisted(() => ({ fetcher: vi.fn(), postFetcher: vi.fn() }));
vi.mock("@/api/fetcher", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/api/fetcher")>()),
  fetcher,
  postFetcher,
}));

const staleUser = createMockUser({ onboarded: false, onboarding_status: "never" });

function SkipButton() {
  const { skip } = useSkipOnboarding();
  return <button onClick={() => void skip()}>Skip</button>;
}

function renderFlow(route: string) {
  return render(
    <StoreProvider>
      <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
        <MemoryRouter initialEntries={[route]}>
          <Routes>
            <Route path="/onboarding" element={<div><header /><AuthCheck><Outlet /></AuthCheck></div>}>
              <Route index element={<span>Welcome to Memento</span>} />
              <Route path="summary" element={<SummaryPage />} />
              <Route path="nickname" element={<SkipButton />} />
            </Route>
            <Route path="/overview" element={<AuthCheck><OnboardingGuard><span>Overview</span></OnboardingGuard></AuthCheck>} />
          </Routes>
        </MemoryRouter>
      </SWRConfig>
    </StoreProvider>,
  );
}

describe("finishing onboarding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    seedAuth(mockAuth);
    let profileCalls = 0;
    // The first profile load is the pre-onboarding user; the refetch after
    // finishing is slow, so the stale copy stays in the SWR cache meanwhile.
    fetcher.mockImplementation((url: string) => {
      if (url !== endpoint.profile) return Promise.resolve({ success: true, data: null });
      profileCalls += 1;
      if (profileCalls === 1) return Promise.resolve({ success: true, data: staleUser });
      return new Promise(() => undefined);
    });
    sessionStorage.setItem(
      "memento:onboarding-flow:user-123",
      JSON.stringify({ step: 3, reasons: ["memory_preservation"], about: "I care about family.", areas: ["identity_self", "passions_interests"] }),
    );
  });

  it("stays on the overview after completing, even before the profile refetch lands", async () => {
    postFetcher.mockResolvedValue({ success: true, data: null });
    renderFlow("/onboarding/summary");
    await userEvent.click(await screen.findByRole("button", { name: "Continue" }));
    expect(await screen.findByText("Overview")).toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.queryByText("Welcome to Memento")).not.toBeInTheDocument();
    expect(screen.getByText("Overview")).toBeInTheDocument();
  });

  it("stays on the overview after skipping, even before the profile refetch lands", async () => {
    postFetcher.mockResolvedValue({ success: true, data: { onboarding_status: "skipped" } });
    renderFlow("/onboarding/nickname");
    await userEvent.click(await screen.findByRole("button", { name: "Skip" }));
    await waitFor(() => expect(postFetcher).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.queryByText("Welcome to Memento")).not.toBeInTheDocument();
    expect(screen.getByText("Overview")).toBeInTheDocument();
  });
});
