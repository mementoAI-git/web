import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test";
import ExploreCategoryPage from "./category";

const catalogState = vi.hoisted(() => ({ legacy: false }));

vi.mock("swr", async (importOriginal) => {
  const actual = await importOriginal<typeof import("swr")>();
  return {
    ...actual,
    default: () => ({
      data: {
        data: catalogState.legacy ? ["identity"] : [
          {
            slug: "who-i-am",
            title: "Who I Am",
            description: "Personality and identity.",
            order: 4,
            starterTotal: 10,
          },
        ],
      },
      isLoading: false,
    }),
  };
});

vi.mock("./category-details", () => ({
  default: ({ category }: { category: { title: string } }) => <div>{category.title}</div>,
}));

describe("ExploreCategoryPage", () => {
  it("keeps category links open with a clear message while the API is still old", () => {
    catalogState.legacy = true;
    try {
      renderWithProviders(
        <Routes>
          <Route path="/explore/categories/:id" element={<ExploreCategoryPage />} />
        </Routes>,
        { route: "/explore/categories/who-i-am", auth: true },
      );
      expect(screen.getByRole("heading", { name: "Who I Am" })).toBeVisible();
      expect(screen.getByRole("status")).toHaveTextContent("Questions are temporarily unavailable");
      expect(screen.getByRole("link", { name: "Back to Topics" })).toHaveAttribute("href", "/explore");
    } finally {
      catalogState.legacy = false;
    }
  });
  it("redirects a legacy category slug to its canonical route", async () => {
    renderWithProviders(
      <Routes>
        <Route path="/explore/categories/:id" element={<ExploreCategoryPage />} />
      </Routes>,
      { route: "/explore/categories/identity", auth: true },
    );
    expect(await screen.findByText("Who I Am")).toBeVisible();
  });
});
