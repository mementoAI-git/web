import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HostChatEnrichmentBar } from "./host-chat-enrichment-bar";
import type { CategoryScore } from "@/features/enrichment";

const sampleCategories: CategoryScore[] = [
  {
    key: "relationships_people",
    label: "Relationships & People",
    score: 12,
    weight: 1.5,
    itemCount: 2,
    unlocked: true,
  },
  {
    key: "work_purpose",
    label: "Work & Purpose",
    score: 45,
    weight: 1,
    itemCount: 5,
    unlocked: true,
  },
  {
    key: "hopes_legacy",
    label: "Hopes & Legacy",
    score: 0,
    weight: 1,
    itemCount: 0,
    unlocked: false,
  },
];

describe("HostChatEnrichmentBar", () => {
  it("renders overall score without category list when categoryScores omitted", () => {
    render(
      <HostChatEnrichmentBar enrichmentScore={42} deltaToday={0} />,
    );
    expect(screen.getByText("42%")).toBeTruthy();
    expect(screen.queryByText("By life area")).toBeNull();
  });

  it("lists categories sorted with lowest unlocked score first, then locked", () => {
    render(
      <HostChatEnrichmentBar
        enrichmentScore={30}
        deltaToday={1}
        categoryScores={sampleCategories}
      />,
    );

    const list = screen.getByLabelText("Enrichment percentage by category");
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(within(items[0]).getByText("Relationships & People")).toBeTruthy();
    expect(within(items[0]).getByText("12%")).toBeTruthy();
    expect(within(items[2]).getByText("Soon")).toBeTruthy();
  });
});
