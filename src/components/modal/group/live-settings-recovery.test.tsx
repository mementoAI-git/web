import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { renderWithProviders, server } from "@/test";
import SettingsPage from "@/pages/dashboard/settings";
import Modal from "@/components/modal";

vi.mock("pdfjs-dist", () => ({ getDocument: vi.fn(), GlobalWorkerOptions: {}, version: "test" }));
vi.mock("@/contexts/feature-flags", () => ({ useFeatureFlags: () => ({ canUse: () => true }) }));

it("opens the registered group dialog from Settings and guards the real shell during a failed save", async () => {
  let finish!: () => void;
  let requests = 0;
  server.use(http.post("http://localhost:3000/api/groups", async () => {
    requests++;
    await new Promise<void>(resolve => { finish = resolve; });
    return HttpResponse.json({ message: "Group service unavailable" }, { status: 503 });
  }));
  renderWithProviders(<><Routes><Route path="/settings/:tab" element={<SettingsPage />} /></Routes><Modal /></>, { auth: true, route: "/settings/beneficiary" });
  await userEvent.click(screen.getByRole("tab", { name: /Groups/ }));
  await userEvent.click(screen.getByRole("button", { name: "Add group" }));
  const input = screen.getByPlaceholderText("e.g. Family");
  await userEvent.type(input, "My family");
  await userEvent.click(screen.getByRole("button", { name: "Create group", exact: true }));
  await waitFor(() => expect(requests).toBe(1));
  await userEvent.keyboard("{Escape}");
  await userEvent.click(screen.getByRole("button", { name: /Cancel.*ESC/ }));
  expect(input).toBeInTheDocument();
  finish();
  await waitFor(() => expect(screen.getByRole("button", { name: "Create group", exact: true })).toBeEnabled());
  expect(input).toHaveValue("My family");
  await userEvent.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByPlaceholderText("e.g. Family")).not.toBeInTheDocument());
});
