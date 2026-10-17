import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test";
import { createMockUser } from "@/test/fixtures";
import { server } from "@/test/mocks/server";
import { http, HttpResponse } from "msw";
import MemoryInsightsModal from "./index";
import Modal from "@/components/modal";
import { useModal } from "@/hooks/use-modal";

// The modal shell imports story media previews; they are outside this insights test.
vi.mock("@/components/modal/memory/create/file-thumbnails", () => ({ FileThumbnails: () => null }));

const API_BASE = "http://localhost:3000/api";

const HERO_SNOOZE_KEY = "memento:memory-insights-hero-snooze-until";

beforeEach(() => {
  localStorage.removeItem(HERO_SNOOZE_KEY);
});
afterEach(() => {
  localStorage.removeItem(HERO_SNOOZE_KEY);
});

const minimalUserStats = {
  streak_count: 0,
  reflections_count: 0,
  stories_count: 0,
  pending_insights_count: 0,
  enrichment_score: 10,
  category_scores: [],
  lowest_category: null,
  beneficiary_access_unlocked: true,
  milestone: {
    reached_threshold: 0,
    reached_label: "Start",
    reached_description: "",
    next_threshold: 25,
    next_label: "Growing",
    is_max: false,
  },
  nudge: null,
  jump_pills: [],
  spotlight: null,
};

function InsightsLauncher() {
  const { open } = useModal();
  return <><button onClick={() => open("memory-insights")}>Open insights</button><Modal /></>;
}

describe("MemoryInsightsModal", () => {
  it("uses a solid surface and only its own close control when opened as a modal", async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(<InsightsLauncher />, { route: "/overview", auth: true });
    await user.click(screen.getByRole("button", { name: "Open insights" }));
    expect(container.querySelector('[data-slot="memory-insights-panel"]')).toHaveClass("bg-bg-neutral-solid");
    expect(screen.queryByRole("button", { name: /Cancel/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close memory insights" }));
    expect(screen.queryByRole("heading", { name: "Memory insights" })).not.toBeInTheDocument();
  });

  it("shows Recent Activities in the General panel", async () => {
    renderWithProviders(<MemoryInsightsModal />, { route: "/overview", auth: true });
    expect(await screen.findByRole("heading", { name: /recent activities/i })).toBeInTheDocument();
    expect(screen.getByRole("region", {name:"Memory statistics"})).toBeInTheDocument();
    expect(screen.getByText("Memories captured")).toBeInTheDocument();
    expect(screen.getByText("Top dimension")).toBeInTheDocument();
    expect(await screen.findByText("What are your thoughts on the...")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /see all/i })).toHaveAttribute("href", "/stories");
  });

  it("uses the Insights sidebar to switch the visible modal section", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MemoryInsightsModal />, {
      route: "/overview",
      auth: true,
    });

    expect(await screen.findByRole("tab", { name: "General" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await user.click(screen.getByRole("tab", { name: "People" }));

    expect(screen.getByRole("tab", { name: "People" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("heading", { name: "People" })).toBeInTheDocument();
    expect(
      screen.queryByText(/Your summary is being built/i),
    ).not.toBeInTheDocument();
  });

  it("shows reflection hero first and tucks category tabs behind All observations", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MemoryInsightsModal />, {
      route: "/overview",
      auth: true,
    });
    expect(
      screen.queryByRole("tab", { name: /^preferences$/i }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByTestId("memory-insights-observations-toggle"));
    expect(
      await screen.findByRole("tab", { name: /^all$/i }),
    ).toBeInTheDocument();
  });

  it("shows empty summary when no context", async () => {
    server.use(
      http.get(`${API_BASE}/users/persona`, () =>
        HttpResponse.json({
          status: 200,
          message: "Persona retrieved successfully",
          data: null,
        }),
      ),
      http.get(`${API_BASE}/users/context`, () =>
        HttpResponse.json({ success: true, data: {} }),
      ),
      http.get(`${API_BASE}/users/persona/memory-insights-summary`, () =>
        HttpResponse.json({
          status: 200,
          message: "Not enough context for a summary yet",
          data: { summary: null, generated_at: null, cached: false },
        }),
      ),
      http.get(`${API_BASE}/users/stats`, () =>
        HttpResponse.json({ success: true, data: minimalUserStats }),
      ),
    );
    renderWithProviders(<MemoryInsightsModal />, {
      route: "/overview",
      auth: true,
    });
    expect(
      await screen.findByText(/your summary is being built/i),
    ).toBeInTheDocument();
  });

  it("shows AI summary from endpoint when returned", async () => {
    const userWithContext = createMockUser({
      context: {
        self_description: "A creative person who loves storytelling.",
        current_priority: "Preserving family memories",
        join_reasons: ["legacy", "reflection"],
      },
    });
    server.use(
      http.get(`${API_BASE}/users/persona`, () =>
        HttpResponse.json({
          status: 200,
          message: "Persona retrieved successfully",
          data: null,
        }),
      ),
      http.get(`${API_BASE}/users/context`, () =>
        HttpResponse.json({ success: true, data: userWithContext.context }),
      ),
      http.get(`${API_BASE}/users/persona/memory-insights-summary`, () =>
        HttpResponse.json({
          status: 200,
          message: "Memory insights summary generated",
          data: {
            summary:
              "I'm a creative person who loves storytelling.\n\nRight now I'm most focused on preserving family memories.",
            generated_at: "2026-05-01T12:00:00.000Z",
            cached: false,
          },
        }),
      ),
      http.get(`${API_BASE}/users/stats`, () =>
        HttpResponse.json({ success: true, data: minimalUserStats }),
      ),
    );
    renderWithProviders(<MemoryInsightsModal />, {
      route: "/overview",
      auth: true,
    });
    expect(
      await screen.findByText(/A creative person who loves storytelling/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Right now I'm most focused on preserving family memories/i,
      ),
    ).toBeInTheDocument();
  });

  it("shows first-person AI summary and last updated from endpoint", async () => {
    server.use(
      http.get(`${API_BASE}/users/persona`, () =>
        HttpResponse.json({
          status: 200,
          message: "Persona retrieved successfully",
          data: {
            user: "user-1",
            conversation_history_summary:
              "The user enjoys reading and quiet weekends.",
            updated_at: "2026-05-01T12:00:00.000Z",
          },
        }),
      ),
      http.get(`${API_BASE}/users/context`, () =>
        HttpResponse.json({ success: true, data: {} }),
      ),
      http.get(`${API_BASE}/users/persona/memory-insights-summary`, () =>
        HttpResponse.json({
          status: 200,
          message: "Memory insights summary generated",
          data: {
            summary: "I enjoy reading and quiet weekends.",
            generated_at: "2026-05-01T12:00:00.000Z",
            cached: false,
          },
        }),
      ),
      http.get(`${API_BASE}/users/stats`, () =>
        HttpResponse.json({ success: true, data: minimalUserStats }),
      ),
    );
    renderWithProviders(<MemoryInsightsModal />, {
      route: "/overview",
      auth: true,
    });
    const summary = await screen.findByText(
      /I enjoy reading and quiet weekends/i,
    );
    expect(summary.textContent ?? "").not.toMatch(/The user/i);
    expect(screen.getByText(/Updated/i)).toBeInTheDocument();
  });

  it("prefers GET /users/persona over context for insight lists", async () => {
    const user = userEvent.setup();
    server.use(
      http.get(`${API_BASE}/users/persona`, () =>
        HttpResponse.json({
          status: 200,
          message: "Persona retrieved successfully",
          data: {
            user: "user-1",
            key_preferences: ["Persona-only preference"],
            join_reasons: ["memory_preservation"],
          },
        }),
      ),
      http.get(`${API_BASE}/users/context`, () =>
        HttpResponse.json({
          success: true,
          data: {
            key_preferences: ["Should not appear — from context only."],
            join_reasons: [],
          },
        }),
      ),
      http.get(`${API_BASE}/users/persona/memory-insights-summary`, () =>
        HttpResponse.json({
          status: 200,
          message: "Not enough context for a summary yet",
          data: { summary: null, generated_at: null, cached: false },
        }),
      ),
      http.get(`${API_BASE}/users/stats`, () =>
        HttpResponse.json({ success: true, data: minimalUserStats }),
      ),
    );
    renderWithProviders(<MemoryInsightsModal />, {
      route: "/overview",
      auth: true,
    });
    await user.click(screen.getByTestId("memory-insights-observations-toggle"));
    await user.click(await screen.findByRole("tab", { name: /^all$/i }));
    expect(
      await screen.findByText("Persona-only preference"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Should not appear — from context only."),
    ).not.toBeInTheDocument();
  });

  it("shows insights under All when available", async () => {
    const userWithContext = createMockUser({
      context: {
        self_description: "Test",
        current_priority: "Test",
        join_reasons: [],
        key_preferences: ["Pref one"],
      },
    });
    server.use(
      http.get(`${API_BASE}/users/persona`, () =>
        HttpResponse.json({
          status: 200,
          message: "Persona retrieved successfully",
          data: null,
        }),
      ),
      http.get(`${API_BASE}/users/context`, () =>
        HttpResponse.json({ success: true, data: userWithContext.context }),
      ),
      http.get(`${API_BASE}/users/persona/memory-insights-summary`, () =>
        HttpResponse.json({
          status: 200,
          message: "Not enough context for a summary yet",
          data: { summary: null, generated_at: null, cached: false },
        }),
      ),
      http.get(`${API_BASE}/users/stats`, () =>
        HttpResponse.json({ success: true, data: minimalUserStats }),
      ),
    );
    const u = userEvent.setup();
    renderWithProviders(<MemoryInsightsModal />, {
      route: "/overview",
      auth: true,
    });
    await u.click(screen.getByTestId("memory-insights-observations-toggle"));
    await u.click(await screen.findByRole("tab", { name: /^all$/i }));
    expect(await screen.findByText("Pref one")).toBeInTheDocument();
  });

  it("shows spotlight thread when stats include spotlight", async () => {
    server.use(
      http.get(`${API_BASE}/users/stats`, () =>
        HttpResponse.json({
          success: true,
          data: {
            ...minimalUserStats,
            spotlight: {
              memory_id: "mem-spot-1",
              title: "Sunday letters",
              excerpt:
                "A long enough excerpt to pass the server threshold and appear in the panel for the user.",
              source: "explicit",
              updated_at: "2026-01-01T12:00:00.000Z",
            },
          },
        }),
      ),
    );
    renderWithProviders(<MemoryInsightsModal />, {
      route: "/overview",
      auth: true,
    });
    expect(
      await screen.findByText(/A thread from your Memento/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Sunday letters")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /open this memory/i }),
    ).toHaveAttribute("href", "/stories/mem-spot-1");
  });

  it("links spotlight conversation to host chat", async () => {
    server.use(
      http.get(`${API_BASE}/users/stats`, () =>
        HttpResponse.json({
          success: true,
          data: {
            ...minimalUserStats,
            spotlight: {
              memory_id: "conv-9",
              title: "Chat summary title",
              excerpt:
                "Summary text long enough for the modal to display it here without issues for the reader.",
              source: "conversation",
              updated_at: null,
            },
          },
        }),
      ),
    );
    renderWithProviders(<MemoryInsightsModal />, {
      route: "/overview",
      auth: true,
    });
    const link = await screen.findByRole("link", { name: /open this memory/i });
    expect(link).toHaveAttribute("href", "/chat/conv-9");
    expect(screen.getByText("From conversation")).toBeInTheDocument();
  });

  it("shows snoozed strip when snapshot hero is snoozed in localStorage", async () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    localStorage.setItem(HERO_SNOOZE_KEY, future);
    server.use(
      http.get(`${API_BASE}/users/stats`, () =>
        HttpResponse.json({ success: true, data: minimalUserStats }),
      ),
    );
    renderWithProviders(<MemoryInsightsModal />, {
      route: "/overview",
      auth: true,
    });
    expect(
      await screen.findByText(/Snapshot hidden until/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Crafting your summary/i),
    ).not.toBeInTheDocument();
  });

  it("links jump pills to host chat with starter query when primary conversation exists", async () => {
    server.use(
      http.get(`${API_BASE}/users/profile`, () =>
        HttpResponse.json({
          success: true,
          data: {
            ...createMockUser(),
            primary_conversation_id: "thread-primary",
          },
          message: "Profile fetched successfully",
        }),
      ),
      http.get(`${API_BASE}/users/stats`, () =>
        HttpResponse.json({
          success: true,
          data: {
            ...minimalUserStats,
            jump_pills: [
              {
                category_key: "identity_self",
                starter: "Tell me about a formative place.",
              },
            ],
          },
        }),
      ),
    );
    renderWithProviders(<MemoryInsightsModal />, {
      route: "/overview",
      auth: true,
    });
    const link = await screen.findByRole("link", {
      name: /Tell me about a formative place/i,
    });
    const href = link.getAttribute("href") ?? "";
    expect(href).toContain("/chat/thread-primary");
    expect(href).toContain("starter=");
  });
});

it("offers independent retries for progress, summary and beneficiaries", async () => {
  let fail = true;
  server.use(
    http.get(`${API_BASE}/users/stats`, () => HttpResponse.json(fail ? { message: "offline" } : { success: true, data: minimalUserStats }, { status: fail ? 503 : 200 })),
    http.get(`${API_BASE}/beneficiaries`, () => HttpResponse.json(fail ? { message: "offline" } : { success: true, data: { docs: [] } }, { status: fail ? 503 : 200 })),
    http.get(`${API_BASE}/users/persona/memory-insights-summary`, () => HttpResponse.json(fail ? { message: "offline" } : { success: true, data: { summary: "Recovered summary" } }, { status: fail ? 503 : 200 })),
  );
  const user = userEvent.setup();
  renderWithProviders(<MemoryInsightsModal />, { route: "/overview", auth: true });
  const progress = await screen.findByRole("button", { name: "Retry progress" });
  const summary = await screen.findByRole("button", { name: "Retry summary" });
  const beneficiaries = await screen.findByRole("button", { name: "Retry beneficiaries" });
  expect(screen.queryByText("No beneficiaries yet")).not.toBeInTheDocument();
  expect(screen.queryByText("About 0%")).not.toBeInTheDocument();
  fail = false;
  await user.click(progress);
  await user.click(summary);
  await user.click(beneficiaries);
  expect(await screen.findByText("Recovered summary")).toBeVisible();
  expect(await screen.findByText("No beneficiaries yet")).toBeVisible();
  expect(await screen.findByText("About 10%")).toBeVisible();
});
