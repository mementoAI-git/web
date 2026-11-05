import { expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InsightsOverlayNavigation } from "./insights-overlay-navigation";

it("starts on observations and supports horizontal keyboard navigation", async () => {
  const user = userEvent.setup();
  render(
    <InsightsOverlayNavigation
      content={{
        all: "All insights",
        about: "My summary",
        observations: "Saved observations",
        preferences: "My preferences",
        enrichment: "My progress",
      }}
    />,
  );
  expect(screen.getByRole("tablist")).toHaveAttribute(
    "aria-orientation",
    "horizontal",
  );
  const observations = screen.getByRole("tab", { name: "Observations" });
  expect(observations).toHaveAttribute("aria-selected", "true");
  expect(screen.getByText("Saved observations")).toBeVisible();
  await user.click(screen.getByRole("tab", { name: "About me" }));
  expect(screen.getByText("My summary")).toBeVisible();
  await user.keyboard("{ArrowRight}");
  expect(observations).toHaveFocus();
});
