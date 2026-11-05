import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test";
import Beneficiary from "./index";
it("retains the legacy list component for compatible callers", async () => {
  renderWithProviders(<Beneficiary />, { auth: true });
  expect(await screen.findByText(/no beneficiaries yet/i)).toBeInTheDocument();
});
