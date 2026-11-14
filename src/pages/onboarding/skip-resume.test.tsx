import { beforeEach, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { renderWithProviders, mockUser } from "@/test";
import { server } from "@/test/mocks/server";
import { initialStates, StoreValueProvider } from "@/hooks/use-store";
import type { IUser } from "@/utility/interface";
import Misc from "./misc";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
const key = `memento:onboarding-flow:${mockUser._id}`;

function renderMisc(status: IUser["onboarding_status"]) {
  return renderWithProviders(
    <StoreValueProvider value={{ ...initialStates, user: { ...mockUser, nickname: "Jane", onboarded: false, onboarding_status: status }, setUser: vi.fn() }}>
      <Routes>
        <Route path="/onboarding/misc" element={<Misc />} />
        <Route path="/overview" element={<h1>Overview destination</h1>} />
      </Routes>
    </StoreValueProvider>,
    { route: "/onboarding/misc", auth: true },
  );
}

beforeEach(() => { vi.clearAllMocks(); sessionStorage.clear(); });

it("sends the answers given so far when skipping, then forgets the local copy", async () => {
  let body: unknown;
  server.use(http.post("*/users/onboarding/skip", async ({ request }) => {
    body = await request.json();
    return HttpResponse.json({ success: true, data: { onboarding_status: "skipped" } });
  }));
  sessionStorage.setItem(key, JSON.stringify({ step: 3, reasons: ["memory_preservation"], about: " About me ", areas: ["identity_self"] }));
  const { useSkipOnboarding } = await import("./use-skip-onboarding");
  function SkipButton() {
    const { skip } = useSkipOnboarding();
    return <button onClick={() => void skip()}>Skip</button>;
  }
  renderWithProviders(
    <StoreValueProvider value={{ ...initialStates, user: { ...mockUser, onboarding_status: "never" }, setUser: vi.fn() }}>
      <Routes>
        <Route path="/onboarding/misc" element={<SkipButton />} />
        <Route path="/overview" element={<h1>Overview destination</h1>} />
      </Routes>
    </StoreValueProvider>,
    { route: "/onboarding/misc", auth: true },
  );
  await userEvent.click(screen.getByRole("button", { name: "Skip" }));
  expect(await screen.findByText("Overview destination")).toBeInTheDocument();
  expect(body).toEqual({
    self_description: "About me",
    join_reasons: ["memory_preservation"],
    current_priority: ["identity_self"],
    motivationType: expect.any(String),
  });
  expect(sessionStorage.getItem(key)).toBeNull();
});

it("starts a skipped user from the first question with their saved answers filled in", async () => {
  server.use(http.get("*/users/onboarding-details", () => HttpResponse.json({
    success: true,
    data: { onboarding_status: "skipped", user: {}, persona: { join_reasons: ["self_understanding"], self_description: "I grew up by the sea.", current_priority: ["identity_self", "passions_interests"] } },
  })));
  const user = userEvent.setup();
  renderMisc("skipped");
  expect(await screen.findByRole("button", { name: "Reflect and understand myself better", pressed: true })).toBeEnabled();
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/let’s get started/);
  await user.click(screen.getByRole("button", { name: "Continue" }));
  expect(await screen.findByDisplayValue("I grew up by the sea.")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Continue" }));
  expect(screen.getByRole("button", { name: /Identity and self/, pressed: true })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Passions & Interests/, pressed: true })).toBeInTheDocument();
});

it("doesn't fetch saved answers for someone who has never skipped", async () => {
  const details = vi.fn();
  server.use(http.get("*/users/onboarding-details", () => { details(); return HttpResponse.json({ success: true, data: {} }); }));
  renderMisc("never");
  expect(await screen.findByRole("button", { name: "Continue" })).toBeDisabled();
  expect(details).not.toHaveBeenCalled();
});
