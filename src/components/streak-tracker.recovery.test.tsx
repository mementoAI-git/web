import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { toast } from "sonner";
import { renderWithProviders, server, mockUser } from "@/test";
import { initialStates, StoreValueProvider } from "@/hooks/use-store";
import StreakTracker from "./streak-tracker";
vi.mock("sonner", () => ({ toast: { error: vi.fn(), dismiss: vi.fn() } }));
async function open(lastSeen = new Date().toISOString()) {
  renderWithProviders(<StoreValueProvider value={{ ...initialStates, user: { ...mockUser, last_task_date: lastSeen } }}><StreakTracker><button>View streak</button></StreakTracker></StoreValueProvider>, { auth: true });
  await userEvent.click(screen.getByRole("button", { name: "View streak" }));
}
it("does not manufacture zeroes during loading or failure and retries stats", async () => {
  let fail = true;
  server.use(http.get("*/users/stats", () => HttpResponse.json(fail ? { message: "Unavailable" } : { success: true, data: { streak_count: 0, reflections_count: 2, stories_count: 3 } }, { status: fail ? 503 : 200 })));
  await open();
  const retry = await screen.findByRole("button", { name: "Retry streak" });
  expect(screen.queryByText("Weekly streak")).not.toBeInTheDocument();
  expect(toast.error).toHaveBeenCalled();
  fail = false;
  await userEvent.click(retry);
  expect(await screen.findByText("Weekly streak")).toBeVisible();
  expect(screen.getByText("0 days")).toBeVisible();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(screen.queryByLabelText(/: active/)).not.toBeInTheDocument();
});
it("does not mark this week using a last-seen weekday from a previous month", async () => {
  server.use(http.get("*/users/stats", () => HttpResponse.json({ success: true, data: { streak_count: 3, reflections_count: 2, stories_count: 3 } })));
  const old = new Date(); old.setDate(old.getDate() - 30);
  await open(old.toISOString());
  await waitFor(() => expect(screen.getByText("Weekly streak")).toBeVisible());
  expect(screen.queryByLabelText(/: active/)).not.toBeInTheDocument();
});
