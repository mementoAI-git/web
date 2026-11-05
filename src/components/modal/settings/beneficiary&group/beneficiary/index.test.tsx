import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test";
import Beneficiary from "./index";
it("shows an empty state when there are no people", async () => {
  renderWithProviders(<Beneficiary />, { auth: true });
  expect(await screen.findByText(/no people yet/i)).toBeInTheDocument();
});
