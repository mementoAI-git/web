import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test";
import BrowseTopics from "./browse-topics";

vi.mock("swr", async (importOriginal) => {
  const actual = await importOriginal<typeof import("swr")>();

  return {
    ...actual,
    default: () => ({
      data: {
        data: [
          {
            _id: "topic-1",
            title: "A reflective topic prompt",
            category: "who-i-am",
            category_title: "Who I Am",
          },
        ],
      },
      isLoading: false,
    }),
  };
});

describe("BrowseTopics", () => {
  it("renders wider overview topic images without changing their height", () => {
    const { container } = renderWithProviders(<BrowseTopics />, {
      route: "/overview",
      auth: true,
    });

    const image = container.querySelector("img");
    expect(image).toHaveAttribute("alt", "");
    expect(image).toHaveAttribute("loading", "lazy");
    expect(image).toHaveAttribute("sizes", "238px");
    expect(image).toHaveAttribute("srcset");
    expect(image.closest("a")).toHaveClass("max-w-[238px]");
    expect(image.closest("a")?.parentElement).toHaveClass("sm:w-[238px]");
    expect(image.parentElement).toHaveClass(
      "h-[132px]",
      "sm:h-[152px]",
      "md:h-[164px]",
    );
    expect(container.querySelector(".bg-gradient-to-l")).not.toBeInTheDocument();
  });
});
