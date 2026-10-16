import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { toast } from "sonner";
import { renderWithProviders, server } from "@/test";
import SettingsPage from "@/pages/dashboard/settings";

it("opens cancellation from live Billing and retains feedback with one toast on HTTP failure", async () => {
  let finish!: () => void;
  let requests = 0;
  server.use(
    http.get("http://localhost:3000/api/billing/subscription", () => HttpResponse.json({ success: true, data: { tier: "pro", status: "active", can_manage_subscription: true, billing_interval: "monthly" } })),
    http.post("http://localhost:3000/api/billing/cancel", async () => {
      requests++;
      await new Promise<void>(resolve => { finish = resolve; });
      return HttpResponse.json({ message: "Provider unavailable" }, { status: 503 });
    }),
  );
  const error = vi.spyOn(toast, "error");
  renderWithProviders(<Routes><Route path="/settings/:tab" element={<SettingsPage />} /></Routes>, { auth: true, route: "/settings/billing" });
  await userEvent.click(await screen.findByRole("button", { name: "Manage plan" }));
  await userEvent.click(screen.getByRole("button", { name: "Cancel plan", exact: true }));
  await userEvent.click(screen.getByRole("button", { name: "Yes, cancel" }));
  await userEvent.click(screen.getByRole("radio", { name: "I’m taking a break" }));
  await userEvent.type(screen.getByLabelText("Tell us more (optional)"), "Keep my feedback");
  await userEvent.click(screen.getByRole("button", { name: "Cancel plan", exact: true }));
  await waitFor(() => expect(requests).toBe(1));
  await userEvent.keyboard("{Escape}");
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  finish();
  await waitFor(() => expect(screen.getByRole("button", { name: "Cancel plan", exact: true })).toBeEnabled());
  expect(screen.getByLabelText("Tell us more (optional)")).toHaveValue("Keep my feedback");
  expect(error).toHaveBeenCalledTimes(1);
  expect(error).toHaveBeenCalledWith("Provider unavailable");
});
