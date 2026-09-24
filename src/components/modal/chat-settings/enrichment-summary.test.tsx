import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { EnrichmentSummary } from "./enrichment-summary";
import type { CategoryScore } from "@/features/enrichment";

const categoryScores: CategoryScore[] = [
  { key: "identity_self", label: "Identity & Self", score: 1, weight: 0.1, itemCount: 1, unlocked: true },
  { key: "memories_experiences", label: "Memories & Experiences", score: 10, weight: 0.1, itemCount: 1, unlocked: true },
  { key: "relationships_people", label: "Relationships & People", score: 7, weight: 0.1, itemCount: 1, unlocked: true },
  { key: "heritage_roots", label: "Heritage & Roots", score: 9, weight: 0.1, itemCount: 1, unlocked: true },
  { key: "lessons_wisdom", label: "Lessons & Wisdom", score: 8, weight: 0.1, itemCount: 1, unlocked: true },
  { key: "beliefs_worldview", label: "Beliefs & Worldview", score: 6, weight: 0.1, itemCount: 1, unlocked: true },
  { key: "passions_interests", label: "Passions & Interests", score: 5, weight: 0.1, itemCount: 1, unlocked: true },
  { key: "hopes_legacy", label: "Hopes & Legacy", score: 4, weight: 0.1, itemCount: 1, unlocked: true },
  { key: "work_purpose", label: "Work & Purpose", score: 3, weight: 0.1, itemCount: 1, unlocked: true },
  { key: "everyday_life", label: "Everyday Life", score: 2, weight: 0.1, itemCount: 1, unlocked: true },
];

describe("EnrichmentSummary", () => {
  it("shows a qualitative state without exposing a percentage", () => {
    render(<MemoryRouter><EnrichmentSummary score={72} categoryScores={[]} /></MemoryRouter>);
    expect(screen.getByText("Strong")).toBeInTheDocument();
    expect(screen.queryByText("72%")).not.toBeInTheDocument();
  });

  it("renders media shortcuts and the deep-dive insight rail", () => {
    render(<MemoryRouter><EnrichmentSummary score={34} categoryScores={[]} /></MemoryRouter>);
    for (const label of ["Images", "Videos", "Audio", "Docs", "Links"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
    expect(screen.getByRole("heading", { name: "Deep dive insights" })).toBeInTheDocument();
    expect(screen.getByLabelText("Deep dive insights")).toHaveClass("scrollbar-hide");
    expect(screen.getByText("Missing places")).toHaveClass("line-clamp-1");
    expect(
      screen.getByText("Share the places that shaped you and the memories connected to them."),
    ).toHaveClass("line-clamp-3");
  });

  it("maps shortcuts to conversation file tabs and media filters", async () => {
    const onOpenFiles = vi.fn();
    render(<MemoryRouter><EnrichmentSummary onOpenFiles={onOpenFiles} /></MemoryRouter>);
    await userEvent.click(screen.getByRole("button", { name: "Images" }));
    await userEvent.click(screen.getByRole("button", { name: "Audio" }));
    await userEvent.click(screen.getByRole("button", { name: "Docs" }));
    await userEvent.click(screen.getByRole("button", { name: "Links" }));
    expect(onOpenFiles.mock.calls.map(([request]) => request)).toEqual([
      { tab: "media", mediaFilter: "images" },
      { tab: "media", mediaFilter: "audio" },
      { tab: "docs" },
      { tab: "links" },
    ]);
  });

  it("maps life-area percentages to the reference color order", () => {
    render(
      <MemoryRouter>
        <EnrichmentSummary score={72} categoryScores={categoryScores} />
      </MemoryRouter>,
    );

    const chart = screen.getByRole("img", { name: /life area enrichment distribution/i });
    const segments = Array.from(chart.children) as HTMLElement[];
    expect(segments).toHaveLength(10);
    expect(segments.map((segment) => segment.dataset.lifeArea)).toEqual([
      "memories_experiences",
      "heritage_roots",
      "lessons_wisdom",
      "relationships_people",
      "beliefs_worldview",
      "passions_interests",
      "hopes_legacy",
      "work_purpose",
      "everyday_life",
      "identity_self",
    ]);
    expect(segments[0]).toHaveStyle({ flexGrow: "10" });
    expect(segments[9]).toHaveStyle({ flexGrow: "1" });
  });

  it("keeps all ten life areas visible when scores are unavailable", () => {
    render(
      <MemoryRouter>
        <EnrichmentSummary score={0} categoryScores={[]} />
      </MemoryRouter>,
    );
    const chart = screen.getByRole("img", { name: /life area enrichment distribution/i });
    expect(Array.from(chart.children)).toHaveLength(10);
    expect(chart.firstElementChild).toHaveStyle({ flexGrow: "1" });
  });
});
