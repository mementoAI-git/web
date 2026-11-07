import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter, useLocation } from "react-router-dom";
import { EnrichmentSummary } from "./enrichment-summary";

const {openInsights} = vi.hoisted(()=>({openInsights:vi.fn()}));
vi.mock("@/hooks/use-modal", ()=>({useModal:()=>({open:openInsights})}));

describe("EnrichmentSummary", () => {
  it.each([[72, "Strong"], [35, "Medium"], [7, "Weak"]])("shows a score of %i as %s, without the number", (score, word) => {
    render(<MemoryRouter><EnrichmentSummary score={score} /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: `Enrichment score: ${word}` })).toHaveTextContent(word);
    expect(screen.queryByText(/%$/)).not.toBeInTheDocument();
    expect(screen.getByText(/reflects your memory health across 10 key life areas/i)).toBeInTheDocument();
  });

  it("holds the word back until the score has loaded", () => {
    render(<MemoryRouter><EnrichmentSummary /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: "Enrichment score: –" })).toBeInTheDocument();
  });

  it("offers one card for shared files, and no deep-dive insights", async () => {
    const onOpenFiles = vi.fn();
    render(<MemoryRouter><EnrichmentSummary onOpenFiles={onOpenFiles} fileCount={154} /></MemoryRouter>);
    await userEvent.click(screen.getByRole("button", { name: "Shared media & links (154)" }));
    expect(onOpenFiles).toHaveBeenCalledWith({ tab: "media" });
    for (const label of ["Images", "Videos", "Audio", "Docs", "Links"]) {
      expect(screen.queryByRole("button", { name: label })).not.toBeInTheDocument();
    }
    expect(screen.queryByRole("heading", { name: "Deep dive insights" })).not.toBeInTheDocument();
  });

  it("leaves the count out until it's known", () => {
    render(<MemoryRouter><EnrichmentSummary /></MemoryRouter>);
    expect(screen.getByRole("button", { name: "Shared media & links" })).toBeInTheDocument();
  });

  it("opens Insights on the enrichment tab", async () => {
    const user = userEvent.setup();
    const Location = () => { const { pathname, state } = useLocation(); return <output data-testid="location">{pathname} {state?.section}</output>; };
    render(<MemoryRouter><EnrichmentSummary /><Location /></MemoryRouter>);
    await user.click(screen.getByRole("button", {name:"View Insight"}));
    expect(screen.getByTestId("location")).toHaveTextContent("/insights enrichment");
  });

});
