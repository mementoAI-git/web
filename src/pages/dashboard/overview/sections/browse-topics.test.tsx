import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test";
import BrowseTopics from "./browse-topics";
import {
  EXPLORE_CATEGORY_SLUGS,
  LEGACY_EXPLORE_CATEGORY_ALIASES,
  getExploreCategoryArtwork,
} from "@/utility/data/categories";

const mockResponse = vi.hoisted(() => ({
  data: [] as {
    _id: string;
    title: string;
    category: string;
    category_title: string;
  }[],
  isLoading: false,
}));

vi.mock("swr", async (importOriginal) => {
  const actual = await importOriginal<typeof import("swr")>();
  return {
    ...actual,
    default: () => ({
      data: { data: mockResponse.data },
      isLoading: mockResponse.isLoading,
    }),
  };
});

beforeEach(() => {
  mockResponse.isLoading = false;
  mockResponse.data = [
    {
      _id: "topic-1",
      title: "A reflective topic prompt",
      category: "who-i-am",
      category_title: "Who I Am",
    },
  ];
});

describe("BrowseTopics", () => {
  it.each([
    ...EXPLORE_CATEGORY_SLUGS,
    ...Object.keys(LEGACY_EXPLORE_CATEGORY_ALIASES),
  ])("uses current responsive artwork for %s", (category) => {
    mockResponse.data = [
      {
        _id: "topic-current",
        title: "A topic question",
        category,
        category_title: category,
      },
    ];
    const { container } = renderWithProviders(<BrowseTopics />, {
      route: "/overview",
      auth: true,
    });
    const image = container.querySelector("img");
    const artwork = getExploreCategoryArtwork(category)!;
    expect(image).toHaveAttribute("src", artwork.src);
    expect(image).toHaveAttribute("srcset", artwork.srcSet);
    expect(image?.getAttribute("src")).toContain("/categories/generated/");
  });

  it("renders wider overview topic images without changing their height", () => {
    const { container } = renderWithProviders(<BrowseTopics />, {
      route: "/overview",
      auth: true,
    });

    const image = container.querySelector("img");
    expect(image).toHaveAttribute("alt", "");
    expect(image).toHaveAttribute("loading", "lazy");
    expect(image).toHaveAttribute("sizes", "230px");
    expect(image).toHaveAttribute("srcset");
    expect(image.closest("a")).toHaveClass("max-w-[230px]");
    expect(image.closest("a")?.parentElement).toHaveClass("sm:w-[230px]");
    expect(image.parentElement).toHaveClass("h-[120px]");
    expect(
      container.querySelector(".bg-gradient-to-l"),
    ).not.toBeInTheDocument();
  });
  it("shows seven topics and shuffles the visible selection without losing links", async () => {
    mockResponse.data = Array.from({ length: 11 }, (_, index) => ({
      _id: `topic-${index}`,
      title: `Reflective question ${index}`,
      category: "who-i-am",
      category_title: "Who I Am",
    }));
    const user = userEvent.setup();
    const { container } = renderWithProviders(<BrowseTopics />, {
      route: "/overview",
      auth: true,
    });
    const getTopicLinks = () =>
      [...container.querySelectorAll('a[href^="/chat/reply/"]')].map((link) =>
        link.getAttribute("href"),
      );
    const before = getTopicLinks();
    expect(before).toHaveLength(7);
    vi.spyOn(Math, "random").mockReturnValue(0);
    try {
      await user.click(screen.getByRole("button", { name: "Shuffle topics" }));
      const after = getTopicLinks();
      expect(after).toHaveLength(7);
      expect(new Set(after).size).toBe(7);
      expect(after).not.toEqual(before);
      expect(after.some((href) => !before.includes(href))).toBe(true);
      expect(screen.getByRole("link", { name: "See all" })).toHaveAttribute(
        "href",
        "/explore",
      );
    } finally {
      vi.restoreAllMocks();
    }
  });

  it("brings in another topic even when the random draw repeats the current selection", async () => {
    mockResponse.data = Array.from({ length: 8 }, (_, index) => ({
      _id: `topic-${index}`,
      title: `Question ${index}`,
      category: "who-i-am",
      category_title: "Who I Am",
    }));
    const user = userEvent.setup();
    renderWithProviders(<BrowseTopics />, { route: "/overview", auth: true });
    expect(screen.queryByText("Question 7")).not.toBeInTheDocument();
    vi.spyOn(Math, "random").mockReturnValue(0.999);
    try {
      await user.click(screen.getByRole("button", { name: "Shuffle topics" }));
      expect(screen.getByText("Question 7")).toBeInTheDocument();
    } finally {
      vi.restoreAllMocks();
    }
  });

  it("disables shuffle when there is only one topic", () => {
    renderWithProviders(<BrowseTopics />, { route: "/overview", auth: true });
    expect(
      screen.getByRole("button", { name: "Shuffle topics" }),
    ).toBeDisabled();
  });

  it("shows seven placeholders and disables shuffle during loading", () => {
    mockResponse.isLoading = true;
    const { container } = renderWithProviders(<BrowseTopics />, {
      route: "/overview",
      auth: true,
    });
    expect(container.querySelectorAll(".snap-start")).toHaveLength(7);
    expect(
      screen.getByRole("button", { name: "Shuffle topics" }),
    ).toBeDisabled();
  });
});
