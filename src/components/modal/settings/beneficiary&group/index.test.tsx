import { describe, it, expect } from "vitest";
import { screen, within } from "@testing-library/react";
import { renderWithProviders } from "@/test";
import BeneficiaryAndGroup from "./index";

describe("BeneficiaryAndGroup", () => {
  it("shows beneficiary and group counts on sub-navigation", async () => {
    renderWithProviders(<BeneficiaryAndGroup />, { route: "/settings/beneficiary", auth: true });

    expect(screen.getByRole("button", { name: /add beneficiary/i })).toBeInTheDocument();

    const nav = await screen.findByRole("navigation", { name: /beneficiary and group sections/i });
    expect(nav.textContent).toMatch(/Beneficiary/);
    expect(nav.textContent).toMatch(/Group/);
    expect(within(nav).getAllByText("0")).toHaveLength(2);

    const beneficiaryTab = within(nav).getByRole("tab", { name: /^Beneficiaries,/i });
    expect(beneficiaryTab).toHaveClass("text-xs", "py-2", "w-fit", "h-fit");
  });
});
