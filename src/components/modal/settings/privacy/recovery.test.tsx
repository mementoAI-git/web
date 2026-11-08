import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { Route, Routes } from "react-router-dom";
import { toast } from "sonner";
import { renderWithProviders, server } from "@/test";
import SettingsPage from "@/pages/dashboard/settings";
import { authService } from "@/utility/auth-service";

import { vi } from "vitest";

// Radix's checkbox (delete flow) measures itself; jsdom has no ResizeObserver.
vi.stubGlobal("ResizeObserver", class {
  observe() {}
  unobserve() {}
  disconnect() {}
});

function show() {
  renderWithProviders(<Routes><Route path="/settings/:tab" element={<SettingsPage />} /><Route path="/login" element={<p>Login destination</p>} /></Routes>, { auth: true, route: "/settings/privacy" });
}
it.each(["Log out", "Delete account"])("returns keyboard focus to %s after cancellation", async (name) => {
  const user = userEvent.setup();
  show();
  const trigger = screen.getByRole("button", { name, exact: true });
  await user.click(trigger);
  await screen.findByRole("dialog");
  await user.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  await waitFor(() => expect(trigger).toHaveFocus());
});
it("keeps a rejected deletion open, guards pending dismissal and clears auth only after success", async () => {
  let finish!: () => void;
  let failed = true;
  let calls = 0;
  server.use(http.delete("http://localhost:3000/api/users/account", async () => {
    calls++;
    if (failed) await new Promise<void>(resolve => { finish = resolve; });
    return HttpResponse.json(failed ? { success: false, message: "Try again later" } : { success: true });
  }));
  show();
  await userEvent.click(screen.getByRole("button", { name: "Delete account", exact: true }));
  await userEvent.click(await screen.findByRole("button", { name: "Start deletion process" }));
  const confirmButton = screen.getByRole("button", { name: "Log out and delete account" });
  expect(confirmButton).toBeDisabled();
  await userEvent.type(screen.getByLabelText(/to confirm this action/), "DELETE");
  await userEvent.dblClick(confirmButton);
  await waitFor(() => expect(calls).toBe(1));
  await userEvent.keyboard("{Escape}");
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  finish();
  await screen.findByRole("button", { name: "Log out and delete account" });
  expect(authService.getAuthData()).not.toBeNull();
  failed = false;
  await userEvent.click(screen.getByRole("button", { name: "Log out and delete account" }));
  await screen.findByText("Login destination");
  expect(authService.getAuthData()).toBeNull();
});
it("logs out other devices before this device and retains the session if revocation fails", async () => {
  const paths: string[] = [];
  let failOther = true;
  server.use(
    http.delete("http://localhost:3000/api/auth/logout/other", () => {
      paths.push("other");
      return HttpResponse.json({ success: !failOther }, { status: failOther ? 503 : 200 });
    }),
    http.delete("http://localhost:3000/api/auth/logout", () => { paths.push("current"); return HttpResponse.json({ success: true }); }),
  );
  const success = vi.spyOn(toast, "success");
  success.mockClear();
  show();
  await userEvent.click(screen.getByRole("button", { name: "Log out", exact: true }));
  await userEvent.click(screen.getByRole("button", { name: "Log out of all devices", exact: true }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Log out of all devices", exact: true })).toBeEnabled());
  expect(paths).toEqual(["other"]);
  expect(authService.getAuthData()).not.toBeNull();
  expect(success).not.toHaveBeenCalled();
  failOther = false;
  await userEvent.click(screen.getByRole("button", { name: "Log out of all devices", exact: true }));
  await screen.findByText("Login destination");
  expect(paths).toEqual(["other", "other", "current"]);
  expect(authService.getAuthData()).toBeNull();
});
