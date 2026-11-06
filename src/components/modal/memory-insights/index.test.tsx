import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { SWRConfig } from "swr";
import { SubscriptionProvider } from "@/contexts/subscription";
import { ThemeProvider } from "@/contexts/theme";
import { BackgroundMusicProvider } from "@/hooks/use-background-music";
import endpoint from "@/api/endpoint";
import MemoryInsightsModal from ".";

beforeEach(() => {
  close.mockClear();
  openModal.mockClear();
  pushModal.mockClear();
  modalState = [];
  patch.mockClear();
  del.mockClear();
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});
afterEach(() => vi.unstubAllGlobals());

const close = vi.fn();
const { patch, del } = vi.hoisted(() => ({
  patch: vi.fn().mockResolvedValue({}),
  del: vi.fn().mockResolvedValue({}),
}));
vi.mock("@/api/mutations", async (original) => ({
  ...(await original<typeof import("@/api/mutations")>()),
  patch,
  del,
}));
const openModal = vi.fn();
const pushModal = vi.fn();
let modalState: { name: string; props?: unknown }[] = [];
vi.mock("@/hooks/use-modal", () => ({
  useModal: () => ({
    close,
    open: openModal,
    push: pushModal,
    state: modalState,
  }),
}));
vi.mock("@/hooks/use-store", () => ({ useStore: () => ({ user: null }) }));

const spanningInsight = {
  id: "insight-1",
  title: "You protect your Sundays",
  body: "Rest with family returns across your stories.",
  categories: ["everyday_life", "relationships_people"],
  source_count: 3,
  status: "established",
};
const singleInsight = {
  id: "insight-2",
  title: "Your values keep coming up",
  body: "You often explore who you are.",
  categories: ["identity_self"],
  source_count: 3,
  status: "emerging",
};

const observation = (
  field: string,
  heading: string,
  note = "You often come back to this.",
  id = `${field}-${heading.length}`,
) => ({
  id,
  field,
  heading,
  note,
  category_key: "identity_self",
  source_count: 1,
});

const defaultObservations = [
  observation(
    "important_notes",
    "You value independent thinking",
    "Autonomy shows up in your decisions.",
    "note-1",
  ),
  observation("goals_and_aspirations", "You want to write a book"),
  observation("emotional_state_trends", "You feel calm by the sea"),
  observation("key_preferences", "You prefer quiet mornings"),
];

function Location() {
  const location = useLocation();
  return (
    <output data-testid="location" data-state={JSON.stringify(location.state)}>
      {location.pathname}
      {location.search}
    </output>
  );
}

function setup({
  observations = defaultObservations as object[],
  generating = false,
  insights = {
    insights: [spanningInsight, singleInsight],
    generated_at: "2026-11-05T00:00:00.000Z",
    next_refresh_at: "2026-11-09T00:00:00.000Z",
    generating: false,
  } as object,
} = {}) {
  return render(
    <MemoryRouter>
      <SWRConfig
        value={{
          provider: () => new Map(),
          revalidateOnMount: false,
          fallback: {
            [endpoint.personaObservations]: { data: { observations, generating } },
            [`${endpoint.personaObservations}/note-1/sources`]: {
              data: {
                sources: [
                  {
                    id: "story-1",
                    title: "Why I changed careers",
                    type: "story",
                    created_at: "2026-05-18T12:00:00.000Z",
                    thumbnail: null,
                  },
                ],
              },
            },
            [`${endpoint.personaObservations}/key_preferences-25/sources`]: {
              data: { sources: [] },
            },
            [endpoint.userStats]: {
              data: {
                enrichment_score: 80,
                reflections_count: 12,
                category_scores: [
                  {
                    key: "identity_self",
                    label: "Identity & Self",
                    score: 24,
                    weight: 1,
                    itemCount: 3,
                    unlocked: true,
                  },
                  {
                    key: "hopes_legacy",
                    label: "Hopes & Legacy",
                    score: 0,
                    weight: 1,
                    itemCount: 0,
                    unlocked: false,
                  },
                ],
              },
            },
            [endpoint.memoriesStats]: { data: { stories_count: 24 } },
            [endpoint.insights]: { data: insights },
            [`${endpoint.insightSources}?insight=insight-1`]: {
              data: {
                sources: [
                  {
                    id: "older",
                    title: "Sunday at home",
                    type: "story",
                    created_at: "2026-01-01T00:00:00.000Z",
                    thumbnail: null,
                  },
                  {
                    id: "newer",
                    title: "Talking about rest",
                    type: "conversation",
                    created_at: "2026-09-12T00:00:00.000Z",
                    thumbnail: null,
                  },
                ],
              },
            },
            [`${endpoint.insightSources}?category=everyday_life`]: {
              data: { sources: [] },
            },
          },
        }}
      >
        <ThemeProvider>
          <BackgroundMusicProvider>
            <SubscriptionProvider>
              <MemoryInsightsModal />
            </SubscriptionProvider>
            <Location />
          </BackgroundMusicProvider>
        </ThemeProvider>
      </SWRConfig>
    </MemoryRouter>,
  );
}

const tab = (name: string) => screen.getByRole("tab", { name });

it("opens on observations without mixing in preferences", () => {
  setup();
  expect(
    screen.queryByRole("button", { name: "Insight settings" }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("dialog", { name: "My insights" })).toHaveClass(
    "insights-overlay",
  );
  expect(tab("Observations")).toHaveAttribute("aria-selected", "true");
  expect(screen.getByText("You value independent thinking")).toBeVisible();
  expect(
    screen.getByText("Autonomy shows up in your decisions."),
  ).toBeVisible();
  expect(screen.getByText("You want to write a book")).toBeVisible();
  expect(screen.getByText("You feel calm by the sea")).toBeVisible();
  expect(
    screen.queryByText("You prefer quiet mornings"),
  ).not.toBeInTheDocument();
});

it("lists only preferences on the preferences tab", async () => {
  const user = userEvent.setup();
  setup();
  await user.click(tab("Preferences"));
  expect(screen.getByText("You prefer quiet mornings")).toBeVisible();
  expect(
    screen.queryByText("You value independent thinking"),
  ).not.toBeInTheDocument();
});

it("gives observations and preferences an identicon seeded by their id", async () => {
  const user = userEvent.setup();
  setup();
  const identicon = (title: string) =>
    screen.getByText(title).closest("article")?.querySelector("img");
  expect(identicon("You value independent thinking")?.getAttribute("src")).toMatch(
    /^https:\/\/api\.dicebear\.com\/10\.x\/disco\/svg\?seed=/,
  );
  await user.click(tab("Preferences"));
  expect(identicon("You prefer quiet mornings")).toHaveAttribute(
    "src",
    "https://api.dicebear.com/10.x/disco/svg?seed=key_preferences-25",
  );
});

const openOption = async (
  user: ReturnType<typeof userEvent.setup>,
  title: string,
  option: string,
) => {
  await user.click(
    screen.getByRole("button", { name: `Options for ${title}` }),
  );
  await user.click(screen.getByRole("menuitem", { name: option }));
};

it("offers sources, edit, and forget for an observation", async () => {
  const user = userEvent.setup();
  setup();
  await user.click(
    screen.getByRole("button", {
      name: "Options for You value independent thinking",
    }),
  );
  expect(
    screen.getAllByRole("menuitem").map((item) => item.textContent),
  ).toEqual(["Sources", "Edit", "Forget"]);
});

it("lists the sources of an observation and opens one", async () => {
  const user = userEvent.setup();
  setup();
  await openOption(user, "You value independent thinking", "Sources");
  const source = await screen.findByRole("button", {
    name: "View Why I changed careers",
  });
  expect(source).toHaveTextContent("May 18, 2026");
  expect(source.querySelector("img")).toHaveAttribute(
    "src",
    "https://api.dicebear.com/10.x/disco/svg?seed=story-1",
  );
  await user.click(source);
  expect(pushModal).toHaveBeenCalledWith("view-memory", {
    memoryId: "story-1",
  });
  expect(screen.getByTestId("location")).not.toHaveTextContent("/stories");
});

it("says when an observation has no linked sources", async () => {
  const user = userEvent.setup();
  setup();
  await user.click(tab("Preferences"));
  await openOption(user, "You prefer quiet mornings", "Sources");
  expect(await screen.findByText(/No linked sources/)).toBeVisible();
});

it("edits the heading and note in a modal and saves them as one observation", async () => {
  const user = userEvent.setup();
  setup();
  await openOption(user, "You value independent thinking", "Edit");
  expect(screen.getByRole("dialog", { name: "Edit this note" })).toBeVisible();
  const heading = screen.getByRole("textbox", { name: "Heading" });
  const note = screen.getByRole("textbox", { name: "Note" });
  expect(heading).toHaveValue("You value independent thinking");
  expect(note).toHaveValue("Autonomy shows up in your decisions.");
  expect(
    screen.queryByRole("button", { name: "Dismiss" }),
  ).not.toBeInTheDocument();
  const save = screen.getByRole("button", { name: "Save changes" });
  expect(save).toBeDisabled();
  await user.clear(heading);
  expect(save).toBeDisabled();
  await user.type(heading, "You think for yourself");
  await user.click(save);
  expect(patch).toHaveBeenCalledWith(`${endpoint.personaObservations}/note-1`, {
    heading: "You think for yourself",
    note: "Autonomy shows up in your decisions.",
  });
  expect(
    screen.queryByRole("dialog", { name: "Edit this note" }),
  ).not.toBeInTheDocument();
});

it("always shows a note and will not save a card without one", async () => {
  const user = userEvent.setup();
  setup();
  expect(screen.getAllByText("You often come back to this.")).toHaveLength(2);
  expect(screen.queryByText(/^Something you/)).not.toBeInTheDocument();
  await openOption(user, "You want to write a book", "Edit");
  await user.clear(screen.getByRole("textbox", { name: "Note" }));
  expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
});

it("says it is working while the first cards are written", () => {
  setup({ observations: [], generating: true });
  expect(
    screen.getByText("Going through what you’ve shared…"),
  ).toBeVisible();
});

it("keeps the edit open when saving fails", async () => {
  const user = userEvent.setup();
  patch.mockRejectedValueOnce(new Error("offline"));
  setup();
  await openOption(user, "You value independent thinking", "Edit");
  await user.type(screen.getByRole("textbox", { name: "Note" }), "!");
  await user.click(screen.getByRole("button", { name: "Save changes" }));
  expect(screen.getByRole("dialog", { name: "Edit this note" })).toBeVisible();
});

it("shows what will be forgotten and only forgets after confirming", async () => {
  const user = userEvent.setup();
  setup();
  await openOption(user, "You value independent thinking", "Forget");
  const dialog = screen.getByRole("dialog", { name: "Forget this note" });
  expect(
    within(dialog).getByText("You value independent thinking"),
  ).toBeVisible();
  expect(
    within(dialog).getByText("Autonomy shows up in your decisions."),
  ).toBeVisible();
  expect(del).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Keep" }));
  expect(del).not.toHaveBeenCalled();
  await openOption(user, "You value independent thinking", "Forget");
  await user.click(screen.getByRole("button", { name: "Forget note" }));
  expect(del).toHaveBeenCalledWith(`${endpoint.personaObservations}/note-1`);
});

it("searches the active list and offers a way to clear it", async () => {
  const user = userEvent.setup();
  setup();
  await user.click(screen.getByRole("button", { name: "Search insights" }));
  const search = screen.getByRole("textbox", { name: "Search your insights" });
  expect(search).toHaveFocus();
  await user.type(search, "unmatched");
  expect(screen.getByText("No matches")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Clear search" }));
  expect(screen.getByText("You value independent thinking")).toBeVisible();
});

it("shows honest empty states", async () => {
  const user = userEvent.setup();
  setup({
    observations: [],
    insights: {
      insights: [],
      generated_at: null,
      next_refresh_at: null,
      generating: false,
    },
  });
  expect(
    screen.getByText("Your observations are taking shape"),
  ).toBeVisible();
  await user.click(tab("Insights"));
  expect(screen.getByText("Your insights are taking shape")).toBeVisible();
});

it("explains when the evidence was checked and nothing qualified", async () => {
  const user = userEvent.setup();
  setup({
    insights: {
      insights: [],
      generated_at: "2026-11-05T00:00:00.000Z",
      next_refresh_at: "2026-11-09T00:00:00.000Z",
      generating: false,
    },
  });
  await user.click(tab("Insights"));
  expect(screen.getByText("Nothing stands out yet")).toBeVisible();
  expect(screen.getByText(/It looks again around 9 Nov/)).toBeVisible();
});

it("tells the member while the first insights are being prepared", async () => {
  const user = userEvent.setup();
  setup({
    insights: {
      insights: [],
      generated_at: null,
      next_refresh_at: null,
      generating: true,
    },
  });
  await user.click(tab("Insights"));
  expect(screen.getByText("Looking across your memories…")).toBeVisible();
});

it("shows one icon for the strongest field, two lines of detail, and when the next batch arrives", async () => {
  const user = userEvent.setup();
  setup();
  await user.click(tab("Insights"));
  const card = screen.getByText("You protect your Sundays").closest("article")!;
  const icons = card.querySelectorAll(".insights-field-icon");
  expect(icons).toHaveLength(1);
  expect(icons[0].getAttribute("style")).toContain(
    "--enrichment-everyday-life",
  );
  expect(screen.queryByText(/Relationships & People/)).not.toBeInTheDocument();
  expect(
    screen.getByText("Rest with family returns across your stories."),
  ).toHaveClass("line-clamp-2");
  expect(screen.queryByText("See related stories")).not.toBeInTheDocument();
  expect(screen.getByText(/Memento looks again around 9 Nov/)).toBeVisible();
});

it("opens insight details, sorts sources, and returns to the same tab", async () => {
  const user = userEvent.setup();
  setup();
  await user.click(tab("Insights"));
  await user.click(
    screen.getByRole("button", {
      name: "You protect your Sundays",
    }),
  );
  expect(
    screen.getByText("Memories that helped shape this insight"),
  ).toBeVisible();
  expect(screen.getByText("2 Memory sources")).toBeVisible();
  const titles = () =>
    within(screen.getByRole("table", { name: "Memory sources" }))
      .getAllByRole("button", { name: /^View / })
      .map((button) => button.getAttribute("aria-label"));
  expect(titles()).toEqual(["View Talking about rest", "View Sunday at home"]);
  await user.click(screen.getByRole("button", { name: "Sort memory sources" }));
  await user.click(screen.getByRole("menuitem", { name: "Oldest first" }));
  expect(titles()).toEqual(["View Sunday at home", "View Talking about rest"]);
  await user.click(screen.getByRole("button", { name: "Back to insights" }));
  expect(tab("Insights")).toHaveAttribute("aria-selected", "true");
});

it("stacks a story above Insights and remembers where you were", async () => {
  const user = userEvent.setup();
  setup();
  await user.click(tab("Insights"));
  await user.click(
    screen.getByRole("button", { name: "You protect your Sundays" }),
  );
  await user.click(screen.getByRole("button", { name: "View Sunday at home" }));
  expect(close).not.toHaveBeenCalled();
  expect(screen.getByTestId("location")).not.toHaveTextContent("/stories");
  expect(openModal).toHaveBeenCalledWith(
    "memory-insights",
    expect.objectContaining({
      section: "insights",
      history: [
        { kind: "insight", insight: expect.objectContaining({ id: "insight-1" }) },
      ],
    }),
  );
  expect(pushModal).toHaveBeenCalledWith("view-memory", { memoryId: "older" });
});

it("opens a chat as a page and saves the way back in history", async () => {
  const user = userEvent.setup();
  const replaceState = vi.spyOn(window.history, "replaceState");
  setup();
  await user.click(tab("Insights"));
  await user.click(
    screen.getByRole("button", { name: "You protect your Sundays" }),
  );
  await user.click(
    screen.getByRole("button", { name: "View Talking about rest" }),
  );
  expect(replaceState.mock.lastCall?.[0]).toMatchObject({
    usr: {
      openModal: "memory-insights",
      openModalProps: { section: "insights" },
    },
  });
  expect(close).toHaveBeenCalledWith("memory-insights");
  expect(screen.getByTestId("location")).toHaveTextContent("/chat/newer");
  replaceState.mockRestore();
});

it("reopens on the saved tab and details screen", () => {
  modalState = [
    {
      name: "memory-insights",
      props: {
        section: "insights",
        history: [{ kind: "insight", insight: spanningInsight }],
      },
    },
  ];
  setup();
  expect(
    screen.getByText("Memories that helped shape this insight"),
  ).toBeVisible();
  expect(screen.getByRole("button", { name: "Back to insights" })).toBeVisible();
});

it("names only the strongest field in the details header", async () => {
  const user = userEvent.setup();
  setup();
  await user.click(tab("Insights"));
  await user.click(
    screen.getByRole("button", { name: "You protect your Sundays" }),
  );
  expect(screen.queryByText(/Relationships & People/)).not.toBeInTheDocument();
});

it("lists all ten enrichment fields with scores and locked state", async () => {
  const user = userEvent.setup();
  setup();
  await user.click(tab("Enrichment fields"));
  expect(
    within(
      screen.getByRole("table", { name: "Enrichment fields" }),
    ).getAllByRole("button", { name: /^Explore / }),
  ).toHaveLength(10);
  expect(
    screen.getByRole("progressbar", { name: "Identity & Self score" }),
  ).toHaveAttribute("aria-valuenow", "24");
  expect(screen.getByText("Unlocks soon")).toBeVisible();
});

it("shows only memory sources on an enrichment field and can start a reflection", async () => {
  const user = userEvent.setup();
  setup();
  await user.click(tab("Enrichment fields"));
  await user.click(
    screen.getByRole("button", { name: "Explore Everyday Life" }),
  );
  expect(
    await screen.findByRole("region", { name: "Memory sources" }),
  ).toBeVisible();
  expect(
    screen.queryByText("You protect your Sundays"),
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Reflect on this" }));
  expect(close).toHaveBeenCalledWith("memory-insights");
  const location = screen.getByTestId("location");
  expect(location).toHaveTextContent("/chat");
  expect(location.dataset.state).toContain("everyday life");
});

it("brings back the sidebar from Home without closing the overlay", async () => {
  const user = userEvent.setup();
  setup();
  const home = screen.getByRole("button", { name: "Expand sidebar" });
  expect(home).toHaveAttribute("aria-expanded", "false");
  await user.click(home);
  expect(close).not.toHaveBeenCalled();
  expect(home).toHaveAttribute("aria-expanded", "true");
  const collapse = screen.getByRole("button", { name: "Collapse sidebar" });
  expect(collapse).toHaveFocus();
  await user.click(collapse);
  expect(home).toHaveAttribute("aria-expanded", "false");
  expect(home).toHaveFocus();
  expect(close).not.toHaveBeenCalled();
});

it("leaves Insights for the page chosen in the sidebar", async () => {
  const user = userEvent.setup();
  setup();
  await user.click(screen.getByRole("button", { name: "Expand sidebar" }));
  await user.click(screen.getByRole("button", { name: /Explore topics/ }));
  expect(screen.getByTestId("location")).toHaveTextContent("/explore");
  expect(close).toHaveBeenCalledWith("memory-insights");
});

it("closes with Escape", async () => {
  const user = userEvent.setup();
  setup();
  await user.keyboard("{Escape}");
  expect(close).toHaveBeenCalledWith("memory-insights");
});
