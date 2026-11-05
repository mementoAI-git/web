import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { SWRConfig } from "swr";
import { ThemeProvider } from "@/contexts/theme";
import { BackgroundMusicProvider } from "@/hooks/use-background-music";
import endpoint from "@/api/endpoint";
import MemoryInsightsModal from ".";

beforeEach(() => vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} }));
afterEach(() => vi.unstubAllGlobals());

const close = vi.fn();
vi.mock("@/hooks/use-modal", () => ({ useModal: () => ({ close }) }));
vi.mock("@/hooks/use-store", () => ({ useStore: () => ({ user: null }) }));

function setup(
  persona = {
    important_notes: ["You value independent thinking"],
    key_preferences: ["You prefer quiet mornings"],
  },
) {
  return render(
    <MemoryRouter>
      <SWRConfig
        value={{
          provider: () => new Map(),
          revalidateOnMount: false,
          fallback: {
            [endpoint.persona]: { data: persona },
            [endpoint.personaMemoryInsightsSummary]: {
              data: { summary: "Your story so far" },
            },
            [endpoint.userStats]: {
              data: { enrichment_score: 80, reflections_count: 12 },
            },
            [endpoint.memoriesStats]: { data: { stories_count: 24 } },
          },
        }}
      >
        <ThemeProvider>
          <BackgroundMusicProvider>
            <MemoryInsightsModal />
          </BackgroundMusicProvider>
        </ThemeProvider>
      </SWRConfig>
    </MemoryRouter>,
  );
}

it("opens a named full-screen dialog and filters, searches, and reuses the dashboard tools", async () => {
  const user = userEvent.setup();
  setup();
  expect(screen.getByRole("dialog", { name: "My insights" })).toHaveClass(
    "insights-overlay",
  );
  expect(screen.getByText("You value independent thinking")).toBeVisible();
  await user.click(screen.getByRole("tab", { name: "Preferences" }));
  expect(
    screen.queryByText("You value independent thinking"),
  ).not.toBeInTheDocument();
  expect(screen.getByText("You prefer quiet mornings")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Search insights" }));
  const search = screen.getByRole("textbox", { name: "Search your insights" });
  expect(search).toHaveFocus();
  await user.type(search, "unmatched");
  expect(screen.getByText("No matching insights")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Clear search" }));
  expect(screen.getByRole("button", { name: "Quick tools" })).toBeVisible();
  expect(
    document.querySelector('[data-slot="dashboard-overlay-header"]'),
  ).not.toBeNull();
  await user.click(screen.getByRole("button", { name: "Quick tools" }));
  expect(screen.getByRole("button", { name: "Quick note" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Add people" })).toBeVisible();
  await user.keyboard("{Escape}");
  await user.click(screen.getByRole("tab", { name: "About me" }));
  expect(screen.getByText("Your story so far")).toBeVisible();
  await user.keyboard("{Escape}");
  expect(close).toHaveBeenCalledWith("memory-insights");
});

it("shows an honest empty state without sample observations", () => {
  setup({ important_notes: [], key_preferences: [] });
  expect(screen.getByText("Your insights are taking shape")).toBeVisible();
  expect(
    screen.queryByText("You value independent thinking"),
  ).not.toBeInTheDocument();
});
