import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithProviders } from "@/test";

import PricingPage from "./index";

describe("PricingPage", () => {
  it("renders tier columns and roadmap section", () => {
    renderWithProviders(<PricingPage />, { route: "/pricing", auth: true });

    expect(screen.getByRole("heading", { name: /^plans that grow/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^free$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^pro$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^legacy$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^on the roadmap/i })).toBeInTheDocument();
    expect(screen.getAllByText(/coming soon/i).length).toBeGreaterThan(0);
  });
});
