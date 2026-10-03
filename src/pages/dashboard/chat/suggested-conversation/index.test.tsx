import { screen } from "@testing-library/react";
import { vi } from "vitest";
import { renderWithProviders } from "@/test";
import SuggestedConversation from "./index";

vi.mock("swr/infinite", () => ({
  default: () => ({
    data: [{ data: {
      docs: [
        { _id: "1", title: "First question?", category: "work-purpose", category_title: "Work & Purpose" },
        { _id: "2", title: "Second question?", category: "who-i-am" },
      ],
      hasNextPage: false,
    } }],
    isLoading: false,
    size: 1,
    setSize: vi.fn(),
  }),
}));

it("shows readable labels and safely handles missing category names and tags", () => {
  renderWithProviders(<SuggestedConversation />, { auth: true, route: "/chat/conversations/suggested" });
  expect(screen.getByText("Work & Purpose")).toBeVisible();
  expect(screen.getByText("Question")).toBeVisible();
  expect(screen.queryByText("who-i-am")).not.toBeInTheDocument();
});
