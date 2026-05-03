import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { QuickCaptureProcessingBadge } from "./quick-capture-processing-badge";
import { renderWithProviders } from "@/test";

const baseMemory = {
  _id: "1",
  title: "Thought",
  body: "",
  user: "u",
  attachments: [],
  tags: [],
  type: "story",
  status: "save",
  level: 1,
  refrence: "",
  last_opened: "",
  created_at: "",
  updated_at: "",
} as const;

describe("QuickCaptureProcessingBadge", () => {
  it("renders In progress when quick capture is pending enrichment", () => {
    renderWithProviders(
      <QuickCaptureProcessingBadge
        memory={{
          ...baseMemory,
          capture_source: "quick",
          enrichment_status: "pending",
        }}
      />,
    );
    expect(screen.getByText("In progress")).toBeInTheDocument();
  });

  it("renders In progress for daily prompt reflections pending enrichment", () => {
    renderWithProviders(
      <QuickCaptureProcessingBadge
        memory={{
          ...baseMemory,
          capture_source: "quick",
          enrichment_status: "pending",
          prompt_type: "ai-generated",
          prompt_text: "What mattered today?",
        }}
      />,
    );
    expect(screen.getByText("In progress")).toBeInTheDocument();
  });

  it("renders nothing when enrichment is complete", () => {
    const { container } = renderWithProviders(
      <QuickCaptureProcessingBadge
        memory={{
          ...baseMemory,
          capture_source: "quick",
          enrichment_status: "complete",
        }}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing for standard memories", () => {
    const { container } = renderWithProviders(
      <QuickCaptureProcessingBadge memory={{ ...baseMemory, capture_source: "standard" }} />,
    );
    expect(container.firstChild).toBeNull();
  });
});
