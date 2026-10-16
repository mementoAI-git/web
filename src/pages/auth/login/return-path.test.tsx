import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes, useLocation } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { renderWithProviders, server } from "@/test";
import { mockAuth } from "@/test/fixtures";
import TwoFactorPage from "../two-factor";
import LoginPage from "./index";

beforeAll(() => { vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} }); });
afterAll(() => vi.unstubAllGlobals());

function Destination() { const location = useLocation(); return <output data-testid="destination">{location.pathname + location.search + location.hash}</output>; }
it.each([
  ["/stories?search=50%#saved", "/stories?search=50%#saved"],
  ["//outside.example", "/overview"],
])("signs in through the real form and safely returns from %s", async (requested, expected) => {
  server.use(http.post("http://localhost:3000/api/auth/login", () => HttpResponse.json({ success: true, data: { ...mockAuth, onboarded: true } })));
  renderWithProviders(<Routes><Route path="/login" element={<LoginPage />} /><Route path="*" element={<Destination />} /></Routes>, { route: `/login?redirect=${encodeURIComponent(requested)}` });
  await userEvent.type(screen.getByLabelText(/email/i), "test@example.com");
  await userEvent.type(screen.getByLabelText(/^password$/i, { selector: "input" }), "password123");
  await userEvent.click(screen.getByRole("button", { name: /^sign in$/i }));
  expect(await screen.findByTestId("destination")).toHaveTextContent(expected);
});


it("preserves the return destination through the real two-factor handoff", async () => {
  server.use(
    http.post("*/auth/login", () => HttpResponse.json({ success: true, data: { requires_2fa: true, two_fa_token: "temporary+token" } })),
    http.post("*/auth/2fa/verify", async ({ request }) => {
      expect(await request.json()).toEqual({ two_fa_token: "temporary+token", code: "123456" });
      return HttpResponse.json({ success: true, data: { ...mockAuth, onboarded: true } });
    }),
  );
  renderWithProviders(<Routes><Route path="/login" element={<LoginPage />} /><Route path="/two-factor" element={<TwoFactorPage />} /><Route path="*" element={<Destination />} /></Routes>, { route: `/login?redirect=${encodeURIComponent("/stories?view=deleted#saved")}` });
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/email/i), "test@example.com");
  await user.type(screen.getByLabelText(/^password$/i, { selector: "input" }), "password123");
  await user.click(screen.getByRole("button", { name: /^sign in$/i }));
  await user.click(await screen.findByLabelText("Digit 1 of 6"));
  await user.paste("123456");
  await user.click(screen.getByRole("button", { name: /^verify$/i }));
  expect(await screen.findByTestId("destination")).toHaveTextContent("/stories?view=deleted#saved");
});
