import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "@testing-library/react";
import { InsightsOverlayNavigation } from "./insights-overlay-navigation";

describe("InsightsOverlayNavigation", () => {
  it("shows General content by default and switches the selected tab content", async () => {
    const user = userEvent.setup();

    render(
      <InsightsOverlayNavigation
        content={{
          general: <p>Snapshot and at a glance</p>,
          observations: <p>Member observations</p>,
          explore_next: <p>Reflection prompts</p>,
          people: <p>People who matter</p>,
        }}
      />,
    );

    expect(screen.getByRole("tab", { name: "General" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("Snapshot and at a glance")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Explore next" }));

    expect(screen.getByRole("tab", { name: "Explore next" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("Reflection prompts")).toBeInTheDocument();
    expect(
      screen.queryByText("Snapshot and at a glance"),
    ).not.toBeInTheDocument();
  });
});
