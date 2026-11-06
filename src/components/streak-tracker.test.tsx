import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import StreakTracker from "./streak-tracker";

const state = vi.hoisted(() => ({
  userDays: 14,
  statsDays: undefined as number | undefined,
  lastSeen: new Date().toISOString(),
}));
vi.mock("@/hooks/use-store", () => ({
  useStore: () => ({
    user: { streak: state.userDays, last_task_date: state.lastSeen },
  }),
}));
vi.mock("@/components/overview-design-icon", () => ({ OverviewDesignIcon: () => null }));
vi.mock("swr", () => ({
  default: () => ({ data: { data: { streak_count: state.statsDays } } }),
}));

async function openStreak() {
  window.history.replaceState({}, "", "/?streakCard=a");
  render(
    <StreakTracker>
      <button>View streak</button>
    </StreakTracker>,
  );
  await userEvent.click(screen.getByRole("button", { name: "View streak" }));
  await waitFor(() => expect(screen.getByText("day streak")).toBeVisible());
  return screen.getByText("day streak").parentElement?.previousElementSibling;
}

describe("StreakTracker day count", () => {
  afterEach(() => window.history.replaceState({}, "", "/"));
  beforeEach(() => {
    state.userDays = 14;
    state.statsDays = undefined;
    state.lastSeen = new Date().toISOString();
  });
  it("shows the user's day total without dividing it into weeks", async () => {
    expect(await openStreak()).toHaveTextContent("14");
  });
  it("uses the latest stats day count when available", async () => {
    state.statsDays = 5;
    expect(await openStreak()).toHaveTextContent("5");
  });
  describe("card A week row", () => {
    afterEach(() => vi.useRealTimers());

    function pinToFriday() {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date(2026, 10, 6, 12));
    }

    it("runs Monday to Sunday and checks past streak days but not today", async () => {
      pinToFriday();
      state.lastSeen = new Date(2026, 10, 5, 12).toISOString();
      state.statsDays = 3;
      await openStreak();

      expect(screen.getAllByText(/^(M|T|W|F|S|Today)$/).map((node) => node.textContent)).toEqual(["M", "T", "W", "T", "Today", "S", "S"]);
      expect(screen.getAllByLabelText(/: active/).map((node) => node.getAttribute("aria-label"))).toEqual([
        "November 3: active",
        "November 4: active",
        "November 5: active",
      ]);
      expect(screen.getByText("7")).toBeVisible();
    });

    it("keeps today's bolt and date when today already counts", async () => {
      pinToFriday();
      state.lastSeen = new Date(2026, 10, 6, 12).toISOString();
      state.statsDays = 1;
      await openStreak();

      const today = screen.getByLabelText("November 6: active");
      expect(today).toHaveTextContent("6");
      expect(today).not.toHaveClass("bg-fill-streak-complete");
    });
  });

  it("leaves the rounded card's corners clear of the dialog wrapper's background", async () => {
    await openStreak();
    expect(screen.getByRole("dialog")).toHaveClass("!bg-transparent");
  });

  describe("card B", () => {
    afterEach(() => vi.useRealTimers());

    async function openCardB() {
      render(
        <StreakTracker>
          <button>View streak</button>
        </StreakTracker>,
      );
      await userEvent.click(screen.getByRole("button", { name: "View streak" }));
      await waitFor(() => expect(screen.getByText("Weekly streak")).toBeVisible());
    }

    it("is the default, with card A only available by URL", async () => {
      await openCardB();
      expect(screen.queryByText("day streak")).not.toBeInTheDocument();
    });

    it("gives way to card A when asked for", async () => {
      await openStreak();
      expect(screen.queryByText("Weekly streak")).not.toBeInTheDocument();
    });

    it("shows every weekday with today's check once today counts", async () => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date(2026, 10, 6, 12));
      state.lastSeen = new Date(2026, 10, 6, 12).toISOString();
      state.statsDays = 2;
      await openCardB();

      expect(screen.getByText("2 days")).toBeVisible();
      expect(screen.getAllByRole("img").map((node) => node.getAttribute("aria-label"))).toEqual([
        "November 2: no activity",
        "November 3: no activity",
        "November 4: no activity",
        "November 5: active",
        "November 6: active",
        "November 7: no activity",
        "November 8: no activity",
      ]);
    });

    it("uses the singular for a one-day streak", async () => {
      state.statsDays = 1;
      await openCardB();
      expect(screen.getByText("1 day")).toBeVisible();
    });
  });

  it("preserves a zero day count from stats", async () => {
    state.statsDays = 0;
    expect(await openStreak()).toHaveTextContent("0");
  });
});
