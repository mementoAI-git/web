import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test";
import type { IMemory } from "@/utility/interface";
import { StoryDetailsContent, ViewMemoryDetails } from "./view-details";

const memory: IMemory = {
  _id: "story-details", title: "Sunday dinner", body: "<p>At home.</p>",
  user: "mock-user", attachments: [], tags: ["family"], type: "story", status: "active",
  level: 0, refrence: "", visibility: "private", last_opened: "2026-10-01",
  created_at: "2026-10-01", updated_at: "2026-10-01",
};

describe("Story Details", () => {
  it("replaces the old details screen with the shared dialog", () => {
    renderWithProviders(<ViewMemoryDetails data={{ memory: { ...memory, _id: "" } }} />, { auth: true });
    expect(screen.getByRole("dialog", { name: "Story Details" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Visibility" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Story Overview" })).toBeInTheDocument();
    expect(screen.queryByText("Properties")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Title complete")).toBeInTheDocument();
    expect(screen.getByLabelText("Story text complete")).toBeInTheDocument();
  });

  it("shows who can access a shared story", () => {
    renderWithProviders(<StoryDetailsContent memory={{ ...memory, beneficiaries: [{ _id: "person-1", name: "Alice" }] }} />);
    expect(screen.getByText("Shared with Alice")).toBeInTheDocument();
  });

  it("treats an empty rich text body as incomplete", () => {
    renderWithProviders(<StoryDetailsContent memory={{ ...memory, body: "<p></p>" }} />);
    expect(screen.getByLabelText("Story text incomplete")).toBeInTheDocument();
    expect(screen.getByText("0 min read")).toBeInTheDocument();
  });
});
