import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { render } from "@testing-library/react";
import { SettingsSectionCard } from "./settings-section-card";

describe("SettingsSectionCard", () => {
  it("renders title, optional description, and children", () => {
    render(
      <SettingsSectionCard title="Privacy settings" description="Manage preferences.">
        <p>Row content</p>
      </SettingsSectionCard>,
    );

    expect(screen.getByRole("heading", { name: /privacy settings/i })).toBeInTheDocument();
    expect(screen.getByText(/manage preferences/i)).toBeInTheDocument();
    expect(screen.getByText("Row content")).toBeInTheDocument();
  });
});
