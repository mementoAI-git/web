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

    expect(await screen.findByText("Manage your Memento profile")).toBeInTheDocument();

    const viewport = container.querySelector(".page-viewport");
    expect(viewport).toBeTruthy();
    expect(viewport?.className).not.toMatch(/bg-v3-fill-weaker/);
    expect(viewport?.className).not.toMatch(/motion-reduce:bg-white/);

    const nav = screen.getByRole("navigation", { name: /settings sections/i });
    const navStroke = nav.parentElement as HTMLElement | null;
    const settingsColumn = navStroke?.parentElement as HTMLElement | null;
    expect(settingsColumn?.className).toContain("w-full");
    expect(settingsColumn?.className).not.toContain("max-w-[600px]");
    expect(settingsColumn?.className).toContain("bg-white");
    expect(navStroke?.className).toContain("border-b");
    expect(navStroke?.className).toContain("border-v3-stroke-weak");
    const prev = navStroke?.previousElementSibling as HTMLElement | null;
    expect(prev?.className).not.toMatch(/border-b/);
  });

  it("redirects invalid tab to general", async () => {
    renderWithProviders(
      <Routes>
        <Route path="/settings/:tab" element={<SettingsPage />} />
      </Routes>,
      { route: "/settings/not-a-tab", auth: true },
    );

    await waitFor(() => {
      expect(screen.getByText("Manage your Memento profile")).toBeInTheDocument();
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

    await screen.findByText("Manage your Memento profile");
    expect(screen.getByRole("navigation", { name: /settings sections/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /personal info/i })).toHaveAttribute("href", "/settings/general");

    const statsLink = screen.getByRole("link", { name: /^stats$/i });
    expect(statsLink).toHaveAttribute("href", "/settings/stats");
    await user.click(statsLink);
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /^stats$/i })).toBeInTheDocument();
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
