import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Outlet, Routes, Route, useLocation } from "react-router-dom";
import { renderWithProviders } from "@/test";
import SettingsPage from "./index";

const flags = vi.hoisted(() => ({ billing: true }));
vi.mock("@/contexts/feature-flags", () => ({
  useFeatureFlags: () => ({ canUse: (key: string) => key !== "settings.billing_tab" || flags.billing }),
}));

function Location() {
  return <output data-testid="location">{useLocation().pathname}</output>;
}

function renderSettings(route: string) {
  return renderWithProviders(
    <>
      <Routes>
        <Route element={<Outlet context={{ settingsReturnTo: "/stories" }} />}>
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/:tab" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={null} />
      </Routes>
      <Location />
    </>,
    { route, auth: true },
  );
}

describe("SettingsPage", () => {
  it("shows the overview with a link to every section", async () => {
    renderSettings("/settings");
    expect(screen.getByRole("heading", { name: "Settings & profile" })).toBeInTheDocument();
    for (const [name, href] of [
      ["Personal info", "/settings/general"],
      ["Security", "/settings/security"],
      ["People & Groups", "/settings/beneficiary"],
      ["Privacy & Account", "/settings/privacy"],
      ["Billing", "/settings/billing"],
    ])
      expect(screen.getByRole("link", { name })).toHaveAttribute("href", href);
    expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument();
  });

  it("hides billing when the feature is unavailable", () => {
    flags.billing = false;
    renderSettings("/settings");
    expect(screen.queryByRole("link", { name: "Billing" })).not.toBeInTheDocument();
    flags.billing = true;
  });

  it("opens a section and returns to the overview", async () => {
    const user = userEvent.setup();
    renderSettings("/settings");
    await user.click(screen.getByRole("link", { name: "Security" }));
    expect(await screen.findByRole("heading", { name: "Security" })).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: "Back to settings" }));
    expect(screen.getByTestId("location")).toHaveTextContent("/settings");
    expect(screen.getByRole("link", { name: "Security" })).toBeInTheDocument();
  });

  it("supports deep links to a section", async () => {
    renderSettings("/settings/general");
    expect(await screen.findByRole("heading", { name: "About me" })).toBeInTheDocument();
  });

  it("redirects an unknown section to the overview", async () => {
    renderSettings("/settings/not-a-tab");
    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("/settings"));
    expect(screen.getByRole("link", { name: "Security" })).toBeInTheDocument();
  });

  it("closes back to the page the member came from", async () => {
    renderSettings("/settings/security");
    await userEvent.click(screen.getByRole("button", { name: "Close settings" }));
    expect(screen.getByTestId("location")).toHaveTextContent("/stories");
  });
});
