import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test";
import endpoint from "@/api/endpoint";
import ExplorePage from "./index";

const catalogState = vi.hoisted(() => ({
  legacy: false,
  prompts: [] as import("@/utility/interface").DashboardPromptSlot[],
}));

vi.mock("swr", async (importOriginal) => {
  const actual = await importOriginal<typeof import("swr")>();
  return {
    ...actual,
    default: (key: string) =>
      key === endpoint.exploreCategories
        ? {
            data: {
              data: catalogState.legacy
                ? ["career", "identity", "region"]
                : [
                    {
                      slug: "growing-up",
                      title: "Growing Up",
                      description: "Childhood and formative experiences.",
                      order: 0,
                      starterTotal: 10,
                    },
                    {
                      slug: "people-i-love",
                      title: "People I Love",
                      description: "The important people in your life.",
                      order: 1,
                      starterTotal: 10,
                    },
                  ],
            },
            isLoading: false,
          }
        : { data: { data: catalogState.prompts }, isLoading: false },
  };
});

describe("ExplorePage", () => {
  it("renders all approved categories when the API still returns old slugs", () => {
    catalogState.legacy = true;
    try {
      renderWithProviders(<ExplorePage />, { route: "/explore", auth: true });
      expect(screen.getByRole("heading", { name: "Growing Up" })).toBeVisible();
      expect(
        screen.getByRole("heading", { name: "Beliefs & Faith" }),
      ).toBeVisible();
      expect(
        screen.getByRole("heading", { name: "Work & Purpose" }),
      ).toBeVisible();
      expect(
        screen.getByRole("heading", { name: "What's Ahead" }),
      ).toBeVisible();
      expect(
        screen.getByText(/Questions are temporarily unavailable/),
      ).toBeVisible();
    } finally {
      catalogState.legacy = false;
    }
  });
  it("reuses the overview reflection header, AI and catalog cards, and shuffle control", () => {
    catalogState.prompts = [
      {
        slot_kind: "ai",
        display_label: "Just for you",
        answered: false,
        ai_prompt_text: "What brings you joy?",
        reflection_day_key: "2026-10-06",
      },
      {
        slot_kind: "static",
        display_label: "Family",
        answered: false,
        reflection_day_key: "2026-10-06",
        prompt: {
          _id: "family-prompt",
          title: "What values do you share with your family?",
          type: "general",
          tags: [],
          created_at: "",
          updated_at: "",
        },
      },
    ];
    try {
      renderWithProviders(<ExplorePage />, { route: "/explore", auth: true });
      expect(
        screen.getByRole("heading", { name: "Continue reflecting" }),
      ).toBeVisible();
      expect(
        screen.getByRole("button", { name: "Shuffle reflections" }),
      ).toBeEnabled();
      expect(
        screen.getByRole("article", { name: "Just for you" }),
      ).toBeVisible();
      expect(screen.getByRole("article", { name: "Family" })).toBeVisible();
      expect(
        screen.getByRole("button", { name: "Reflect on Just for you" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "Categories" }),
      ).toBeVisible();
    } finally {
      catalogState.prompts = [];
    }
  });

  it("renders categories supplied by the API catalog", () => {
    const { container } = renderWithProviders(<ExplorePage />, {
      route: "/explore",
      auth: true,
    });
    expect(screen.getByRole("heading", { name: "Growing Up" })).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "People I Love" }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: /Growing Up/i })).toHaveAttribute(
      "href",
      "/explore/categories/growing-up",
    );
    const images = Array.from(
      container.querySelectorAll('a[href^="/explore/categories/"] img'),
    );
    expect(images[0]).toHaveAttribute("loading", "eager");
    expect(images[0]).toHaveAttribute("fetchpriority", "high");
    expect(images[1]).toHaveAttribute("loading", "lazy");
  });
});
