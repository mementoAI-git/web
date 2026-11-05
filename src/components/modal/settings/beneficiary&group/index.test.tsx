import { screen } from "@testing-library/react";
import { useLocation } from "react-router-dom";
import { renderWithProviders } from "@/test";
import BeneficiaryAndGroup from "./index";
function Harness() {
  const location = useLocation();
  return (
    <>
      <BeneficiaryAndGroup />
      <output data-testid="location">
        {location.pathname}
        {location.search}
      </output>
    </>
  );
}
it("keeps old Settings links working through the single People surface", async () => {
  renderWithProviders(<Harness />, {
    route: "/settings/beneficiary",
    auth: true,
  });
  expect(await screen.findByTestId("location")).toHaveTextContent(
    /\/chat\/[^?]+\?people=1/,
  );
  expect(
    screen.queryByRole("button", { name: /Add beneficiary/i }),
  ).not.toBeInTheDocument();
});
