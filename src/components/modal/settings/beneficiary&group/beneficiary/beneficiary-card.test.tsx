import { describe, it, expect } from "vitest";
import { renderWithProviders } from "@/test";
import { BeneficiaryCard } from "./beneficiary-card";
import type { IBeneficiaryWithGroups } from "./beneficiary-types";

const minimalBeneficiary: IBeneficiaryWithGroups = {
  _id: "b-1",
  name: "Alex Example",
  email: "alex@example.com",
  relationship: "friend",
  level: 1,
  user: {
    email: "alex@example.com",
    first_name: "Alex",
    last_name: "Example",
    picture_url: null,
  },
  benefactor: {
    email: "self@example.com",
    first_name: "Self",
    last_name: "User",
    picture_url: null,
  },
  accepted_at: "2024-06-01T00:00:00.000Z",
  groups: [],
};

describe("BeneficiaryCard", () => {
  it("renders as a card with 16px padding", () => {
    const { container } = renderWithProviders(<BeneficiaryCard beneficiary={minimalBeneficiary} />, {
      auth: true,
    });
    const article = container.querySelector("article");
    expect(article).toBeTruthy();
    expect(article).toHaveClass("p-4");
  });
});
