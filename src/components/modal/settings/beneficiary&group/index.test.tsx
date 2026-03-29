import { describe, it, expect } from "vitest";
import { screen, within } from "@testing-library/react";
import { renderWithProviders } from "@/test";
import BeneficiaryAndGroup from "./index";

describe("BeneficiaryAndGroup", () => {
  it("shows beneficiary and group counts on sub-navigation", async () => {
    renderWithProviders(<BeneficiaryAndGroup />, { route: "/settings/beneficiary", auth: true });

    const addBeneficiary = screen.getByRole("button", { name: /add beneficiary/i });
    expect(addBeneficiary).toBeInTheDocument();
    expect(addBeneficiary.className).toMatch(/v3-brand-strong/);

    const nav = await screen.findByRole("navigation", { name: /beneficiary and group sections/i });
    expect(nav.parentElement).toHaveClass("border-v3-stroke-weak", "p-4");
    expect(nav.textContent).toMatch(/Beneficiary/);
    expect(nav.textContent).toMatch(/Group/);
    expect(within(nav).getAllByText("0")).toHaveLength(2);

    const beneficiaryTab = within(nav).getByRole("tab", { name: /^Beneficiaries,/i });
    expect(beneficiaryTab).toHaveClass("text-xs", "py-1.5", "w-fit", "h-fit", "bg-v3-fill-strong", "text-white");
  });
});
