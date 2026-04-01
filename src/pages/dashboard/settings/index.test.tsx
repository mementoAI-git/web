import { describe, it, expect } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Routes, Route } from "react-router-dom";
import { renderWithProviders } from "@/test";
import SettingsPage from "./index";

describe("SettingsPage", () => {
  it("renders general settings on /settings/general", async () => {
    const { container } = renderWithProviders(
      <Routes>
        <Route path="/settings/:tab" element={<SettingsPage />} />
      </Routes>,
      { route: "/settings/general", auth: true },
    );

    expect(await screen.findByText("Profile details")).toBeInTheDocument();

    const viewport = container.querySelector(".page-viewport");
    expect(viewport).toBeTruthy();

    const settingsNavs = screen.getAllByRole("navigation", { name: /settings sections/i });
    expect(settingsNavs.length).toBeGreaterThanOrEqual(1);
  });

  it("redirects invalid tab to general", async () => {
    renderWithProviders(
      <Routes>
        <Route path="/settings/:tab" element={<SettingsPage />} />
      </Routes>,
      { route: "/settings/not-a-tab", auth: true },
    );

    await waitFor(() => {
      expect(screen.getByText("Profile details")).toBeInTheDocument();
    });
  });

  it("navigates between tabs via section links", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/settings/:tab" element={<SettingsPage />} />
      </Routes>,
      { route: "/settings/general", auth: true },
    );

    await screen.findByText("Profile details");
    const settingsNavs = screen.getAllByRole("navigation", { name: /settings sections/i });
    expect(settingsNavs.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("link", { name: /personal info/i })).toHaveAttribute("href", "/settings/general");

    const statsLinks = screen.getAllByRole("link", { name: /^stats$/i });
    const statsLink = statsLinks.find((el) => el.getAttribute("href") === "/settings/stats");
    expect(statsLink).toBeTruthy();
    await user.click(statsLink!);
    await waitFor(() => {
      expect(screen.getByText(/highlights from your activity/i)).toBeInTheDocument();
    });

    const securityLinks = screen.getAllByRole("link", { name: /security/i });
    const securityLink = securityLinks.find((el) => el.getAttribute("href") === "/settings/security");
    expect(securityLink).toBeTruthy();
    await user.click(securityLink!);

    await waitFor(() => {
      expect(screen.getByText("Manage your Memento account security")).toBeInTheDocument();
    });
  });
});
