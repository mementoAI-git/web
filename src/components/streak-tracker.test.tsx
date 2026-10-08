import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import StreakTracker from "./streak-tracker";

const state = vi.hoisted(() => ({
  userDays: 14,
  statsDays: undefined as number | undefined,
}));
vi.mock("@/hooks/use-store", () => ({
  useStore: () => ({
    user: { streak: state.userDays, last_seen: new Date().toISOString() },
  }),
}));
vi.mock("swr", () => ({
  default: () => ({ data: { data: { streak_count: state.statsDays } } }),
}));

async function openStreak() {
  render(
    <StreakTracker>
      <button>View streak</button>
    </StreakTracker>,
  );
  await userEvent.click(screen.getByRole("button", { name: "View streak" }));
  await waitFor(() => expect(screen.getByText("Day streak")).toBeVisible());
  return screen.getByText("Day streak").parentElement?.previousElementSibling;
}

describe("StreakTracker day count", () => {
  beforeEach(() => {
    state.userDays = 14;
    state.statsDays = undefined;
  });
  it("shows the user's day total without dividing it into weeks", async () => {
    expect(await openStreak()).toHaveTextContent("14");
  });
  it("uses the latest stats day count when available", async () => {
    state.statsDays = 5;
    expect(await openStreak()).toHaveTextContent("5");
  });
  it("preserves a zero day count from stats", async () => {
    state.statsDays = 0;
    expect(await openStreak()).toHaveTextContent("0");
  });
});
