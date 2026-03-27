import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test";
import SuggestedCategories from "./suggested-conversations";

describe("SuggestedCategories", () => {
  it("uses full width up to 560px max on the section shell", () => {
    renderWithProviders(<SuggestedCategories />, { auth: true, route: "/chat" });

    expect(screen.getByText("Suggested Conversations")).toBeInTheDocument();

    const heading = screen.getByText("Suggested Conversations");
    const shell = heading.parentElement?.parentElement;
    expect(shell?.className).toMatch(/w-full/);
    expect(shell?.className).toMatch(/max-w-\[560px\]/);
  });
});
