import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes, useLocation } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { renderWithProviders, server } from "@/test";
import { mockAuth, mockUser } from "@/test/fixtures";
import { authService } from "@/utility/auth-service";
import AuthCheck from "./auth-check";

function Login() { return <output data-testid="login-path">{useLocation().search}</output>; }
const routes = <Routes><Route path="/stories" element={<AuthCheck><p>Protected stories</p></AuthCheck>} /><Route path="/login" element={<Login />} /></Routes>;

it("preserves the full destination when a signed-out user opens a protected route", async () => {
  renderWithProviders(routes, { route: "/stories?view=deleted#memory", auth: false });
  const result = await screen.findByTestId("login-path");
  expect(new URLSearchParams(result.textContent!).get("redirect")).toBe("/stories?view=deleted#memory");
  expect(screen.queryByText("Protected stories")).not.toBeInTheDocument();
});
it("keeps an expired session on transient refresh failure and recovers through Retry", async () => {
  let failed = true;
  let refreshes = 0;
  server.use(
    http.post("http://localhost:3000/api/auth/refresh-token", () => {
      refreshes++;
      return failed ? HttpResponse.json({ message: "Unavailable" }, { status: 503 }) : HttpResponse.json({ success: true, data: { session: { ...mockAuth, access_token: "renewed", user: { id: mockUser._id }, onboarded: true } } });
    }),
    http.get("http://localhost:3000/api/users/profile", () => HttpResponse.json({ success: true, data: mockUser })),
  );
  renderWithProviders(routes, { route: "/stories", auth: { ...mockAuth, expires_at: new Date(0).toISOString() } });
  const retry = await screen.findByRole("button", { name: "Retry session" });
  expect(authService.getAuthData()).not.toBeNull();
  expect(screen.queryByTestId("login-path")).not.toBeInTheDocument();
  failed = false;
  await userEvent.click(retry);
  await screen.findByText("Protected stories");
  expect(refreshes).toBe(2);
});
it("offers profile recovery before rendering protected content", async () => {
  let failed = true;
  server.use(http.get("http://localhost:3000/api/users/profile", () => failed
    ? HttpResponse.json({}, { status: 503 })
    : HttpResponse.json({ success: true, data: mockUser })));
  renderWithProviders(routes, { route: "/stories", auth: true });
  const retry = await screen.findByRole("button", { name: "Retry profile" });
  expect(screen.queryByText("Protected stories")).not.toBeInTheDocument();
  failed = false;
  await userEvent.click(retry);
  await waitFor(() => expect(screen.getByText("Protected stories")).toBeVisible());
});
