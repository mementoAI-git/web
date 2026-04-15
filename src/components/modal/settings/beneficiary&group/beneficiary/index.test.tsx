import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test";
import BeneficiaryAndGroup from "../index";

describe("Settings Beneficiary list", () => {
  it("renders add control in page header and empty state when there are no beneficiaries", async () => {
    renderWithProviders(<BeneficiaryAndGroup />, { route: "/settings/beneficiary", auth: true });

    expect(screen.getByRole("button", { name: /add beneficiary/i })).toBeInTheDocument();
    expect(await screen.findByText(/no beneficiaries yet/i)).toBeInTheDocument();
  });
});
