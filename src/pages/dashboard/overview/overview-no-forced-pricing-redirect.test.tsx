import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { useLocation } from "react-router-dom";

import { renderWithProviders } from "@/test";

import OverviewPage from "./index";

function PathnameProbe() {
  const { pathname } = useLocation();
  return <span data-testid="current-path">{pathname}</span>;
}

describe("OverviewPage (free tier)", () => {
  it("stays on /overview and does not force navigation to pricing", async () => {
    renderWithProviders(
      <>
        <PathnameProbe />
        <OverviewPage />
      </>,
      { route: "/overview", auth: true },
    );

    expect(screen.getByTestId("current-path")).toHaveTextContent("/overview");

    expect(
      await screen.findByRole("heading", { name: /continue reflecting/i }),
    ).toBeInTheDocument();
  });
});
