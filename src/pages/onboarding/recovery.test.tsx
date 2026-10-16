import { beforeEach, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { toast } from "sonner";
import { renderWithProviders, mockUser } from "@/test";
import { server } from "@/test/mocks/server";
import { initialStates, StoreValueProvider } from "@/hooks/use-store";
import Welcome from "./welcome";
import Misc from "./misc";
import Summary from "./summary";
import Nickname from "./nickname";
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
const setUser = vi.fn();
const key = `memento:onboarding-flow:${mockUser._id}`;
function renderFlow(route: string) {
  return renderWithProviders(<StoreValueProvider value={{ ...initialStates, user: { ...mockUser, nickname: "Jane", onboarded: false, onboarding_status: "never" }, setUser }}>
    <Routes>
      <Route path="/onboarding/welcome" element={<Welcome />} />
      <Route path="/onboarding/nickname" element={<Nickname />} />
      <Route path="/onboarding/misc" element={<Misc />} />
      <Route path="/onboarding/summary" element={<Summary />} />
      <Route path="/overview" element={<h1>Overview destination</h1>} />
    </Routes>
  </StoreValueProvider>, { route, auth: true });
}
beforeEach(() => { vi.clearAllMocks(); sessionStorage.clear(); });
it("keeps the draft when Skip fails and persists Skip before navigating on retry", async () => {
  let fail = true;
  const calls = vi.fn();
  server.use(http.post("*/users/onboarding/skip", () => { calls(); return HttpResponse.json({ success: !fail }, { status: fail ? 503 : 200 }); }));
  sessionStorage.setItem(key, "saved draft");
  const user = userEvent.setup();
  renderFlow("/onboarding/welcome");
  await user.click(screen.getByRole("button", { name: "Skip" }));
  await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
  expect(screen.queryByText("Overview destination")).not.toBeInTheDocument();
  expect(sessionStorage.getItem(key)).toBe("saved draft");
  fail = false;
  await user.click(screen.getByRole("button", { name: "Skip" }));
  expect(await screen.findByText("Overview destination")).toBeInTheDocument();
  expect(setUser).toHaveBeenCalledWith(expect.objectContaining({ onboarding_status: "skipped" }));
  expect(calls).toHaveBeenCalledTimes(2);
});
it("blocks editing after saved-answer loading fails and retries the real endpoint", async () => {
  let fail = true;
  server.use(http.get("*/users/onboarding-details", () => HttpResponse.json(fail ? { message: "unavailable" } : { success: true, data: { user: {}, persona: { join_reasons: ["self_understanding"], current_priority: ["identity_self", "passions_interests"] } } }, { status: fail ? 503 : 200 })));
  const user = userEvent.setup();
  renderFlow("/onboarding/misc?mode=revisit");
  const retry = await screen.findByRole("button", { name: "Retry" });
  expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  expect(screen.getByRole("button", { name: /Preserve memories/i })).toBeDisabled();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  fail = false;
  await user.click(retry);
  expect(await screen.findByRole("button", { name: "Reflect and understand myself better", pressed: true })).toBeEnabled();
  expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
});
it("lets an existing nickname be cleared and preserves edits on failed save", async () => {
  server.use(http.put("*/users/profile", () => HttpResponse.json({ success: false, message: "Cannot save now" })));
  const user = userEvent.setup();
  renderFlow("/onboarding/nickname");
  const field = screen.getByRole("textbox", { name: "Name" });
  await user.clear(field);
  expect(field).toHaveValue("");
  await user.type(field, "River");
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await waitFor(() => expect(toast.error).toHaveBeenCalled());
  expect(field).toHaveValue("River");
  expect(setUser).not.toHaveBeenCalled();
});
it("does not complete or erase answers on an unsuccessful completion response", async () => {
  let fail = true;
  server.use(http.post("*/users/complete-onboarding", () => HttpResponse.json({ success: !fail })));
  sessionStorage.setItem(key, JSON.stringify({ step: 3, reasons: ["memory_preservation"], about: "My introduction", areas: ["identity_self", "passions_interests"] }));
  const user = userEvent.setup();
  renderFlow("/onboarding/summary");
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
  expect(sessionStorage.getItem(key)).toContain("My introduction");
  expect(setUser).not.toHaveBeenCalled();
  fail = false;
  await user.click(screen.getByRole("button", { name: "Continue" }));
  expect(await screen.findByText("Overview destination")).toBeInTheDocument();
  expect(sessionStorage.getItem(key)).toBeNull();
});

it("does not downgrade completed onboarding when Skip returns completed", async () => {
  server.use(http.post("*/users/onboarding/skip", () => HttpResponse.json({ success: true, data: { onboarding_status: "completed" } })));
  renderFlow("/onboarding/welcome");
  await userEvent.click(screen.getByRole("button", { name: "Skip" }));
  expect(await screen.findByText("Overview destination")).toBeInTheDocument();
  expect(setUser).toHaveBeenCalledWith(expect.objectContaining({ onboarding_status: "completed" }));
});
