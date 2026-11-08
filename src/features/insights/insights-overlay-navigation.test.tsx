import { useState } from "react";
import { expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  InsightsOverlayNavigation,
  type InsightsSection,
} from "./insights-overlay-navigation";

function Harness() {
  const [value, setValue] = useState<InsightsSection>("observations");
  return (
    <InsightsOverlayNavigation
      value={value}
      onValueChange={setValue}
      content={{
        observations: "Saved observations",
        insights: "Fresh insights",
        preferences: "My preferences",
        enrichment: "My fields",
        milestones: "My milestones",
      }}
    />
  );
}

it("offers the five sections in order and supports keyboard navigation", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  expect(screen.getByRole("tablist")).toHaveAttribute(
    "aria-orientation",
    "horizontal",
  );
  expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
    "Observations",
    "Insights",
    "Preferences",
    "Enrichment fields",
    "Milestones & streaks",
  ]);
  const observations = screen.getByRole("tab", { name: "Observations" });
  expect(observations).toHaveAttribute("aria-selected", "true");
  expect(screen.getByText("Saved observations")).toBeVisible();
  await user.click(screen.getByRole("tab", { name: "Insights" }));
  expect(screen.getByText("Fresh insights")).toBeVisible();
  await user.keyboard("{ArrowLeft}");
  expect(observations).toHaveFocus();
});
