import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test";
import endpoint from "@/api/endpoint";
import ExplorePage from "./index";

const catalogState = vi.hoisted(() => ({ legacy: false }));

vi.mock("swr", async (importOriginal) => {
  const actual = await importOriginal<typeof import("swr")>();
  return {
    ...actual,
    default: (key: string) =>
      key === endpoint.exploreCategories
        ? {
            data: {
              data: catalogState.legacy ? ["career", "identity", "region"] : [
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
        : { data: { data: [] }, isLoading: false },
  };
});

describe("ExplorePage", () => {
  it("renders all approved categories when the API still returns old slugs", () => {
    catalogState.legacy = true;
    try {
      renderWithProviders(<ExplorePage />, { route: "/explore", auth: true });
      expect(screen.getByRole("heading", { name: "Growing Up" })).toBeVisible();
      expect(screen.getByRole("heading", { name: "Beliefs & Faith" })).toBeVisible();
      expect(screen.getByRole("heading", { name: "Work & Purpose" })).toBeVisible();
      expect(screen.getByRole("heading", { name: "What's Ahead" })).toBeVisible();
      expect(screen.getByText(/Questions are temporarily unavailable/)).toBeVisible();
    } finally {
      catalogState.legacy = false;
    }
  });
  it("renders categories supplied by the API catalog", () => {
    const { container } = renderWithProviders(<ExplorePage />, { route: "/explore", auth: true });
    expect(screen.getByRole("heading", { name: "Growing Up" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "People I Love" })).toBeVisible();
    expect(screen.getByRole("link", { name: /Growing Up/i })).toHaveAttribute(
      "href",
      "/explore/categories/growing-up",
    );
    const images = Array.from(container.querySelectorAll("img"));
    expect(images[0]).toHaveAttribute("loading", "eager");
    expect(images[0]).toHaveAttribute("fetchpriority", "high");
    expect(images[1]).toHaveAttribute("loading", "lazy");
  });
});
