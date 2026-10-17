import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";
import TopicHeader from "./topic-header";
import CategoryPromptCard from "@/pages/dashboard/explore/category-prompt-card";
import type { IMemory } from "@/utility/interface";

const { open, toggleBookmark } = vi.hoisted(() => ({
  open: vi.fn(),
  toggleBookmark: vi.fn(),
}));
vi.mock("@/hooks/use-modal", () => ({ useModal: () => ({ open }) }));
vi.mock("@/hooks/use-bookmark", () => ({
  useBookmark: () => ({ toggleBookmark, isLoading: false }),
}));
vi.mock("swr", () => ({
  default: () => ({ data: { data: { category: "people-i-love" } } }),
  mutate: vi.fn(),
}));

function renderHeader(memory: Partial<IMemory>) {
  render(
    <MemoryRouter
      initialEntries={["/explore/people-i-love", "/chat/reply/question-1"]}
      initialIndex={1}
    >
      <Routes>
        <Route
          path="/explore/people-i-love"
          element={<div>Category page</div>}
        />
        <Route
          path="/chat/reply/:id"
          element={<TopicHeader memory={memory as IMemory} />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => vi.clearAllMocks());

it("uses the question category and preserves share, bookmark and back actions", async () => {
  renderHeader({ _id: "memory-1", title: "What makes your friends special?" });
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    "What makes your friends special?",
  );
  expect(screen.getByText("People I Love")).toBeInTheDocument();
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Share topic" }));
  expect(open).toHaveBeenCalledWith("share-post", {
    id: "memory-1",
    kind: "conversation",
  });
  await user.click(screen.getByRole("button", { name: "Bookmark topic" }));
  expect(toggleBookmark).toHaveBeenCalledOnce();
  await user.click(screen.getByRole("button", { name: "Back" }));
  expect(screen.getByText("Category page")).toBeInTheDocument();
});

it("collapses to the identicon, title and three actions, then restores the badge when expanded", async () => {
  renderHeader({ _id: "memory-1", title: "My question" });
  expect(screen.getByText("People I Love")).toHaveClass(
    "bg-fill-brand-weak",
    "text-text-brand-strong",
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Collapse topic card" }));
  const card = screen.getByRole("region", { name: "Topic question" });
  expect(screen.queryByText("People I Love")).not.toBeInTheDocument();
  expect(card.querySelector("img")).toHaveAttribute("width", "40");
  expect(card.querySelector("img")).toHaveAttribute("height", "40");
  expect(card.firstElementChild?.tagName).toBe("IMG");
  expect(card.querySelectorAll("button")).toHaveLength(3);
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    "My question",
  );
  expect(
    screen.getByRole("button", { name: "Expand topic card" }),
  ).toHaveAttribute("aria-expanded", "false");
  await user.click(screen.getByRole("button", { name: "Share topic" }));
  expect(open).toHaveBeenCalledWith("share-post", {
    id: "memory-1",
    kind: "conversation",
  });
  await user.click(screen.getByRole("button", { name: "Bookmark topic" }));
  expect(toggleBookmark).toHaveBeenCalledOnce();
  await user.click(screen.getByRole("button", { name: "Expand topic card" }));
  expect(screen.getByText("People I Love")).toBeInTheDocument();
  expect(card.querySelector("img")).toHaveAttribute("width", "56");
});

it("does not submit share or bookmark actions before the question has a saved conversation", () => {
  renderHeader({ title: "An unanswered question" });
  expect(screen.getByRole("button", { name: "Share topic" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Bookmark topic" })).toBeDisabled();
});

it("uses the same identicon as the question list, seeded by question ID rather than conversation ID", () => {
  renderHeader({ _id: "different-memory-id", title: "My question" });
  render(
    <MemoryRouter>
      <CategoryPromptCard
        _id="question-1"
        title="My question"
        onFeedback={() => {}}
      />
    </MemoryRouter>,
  );
  const headerImage = document.querySelector(
    '[data-testid="topic-header"] img',
  );
  const listImage = document.querySelector("article img");
  expect(headerImage?.getAttribute("src")).toBe(listImage?.getAttribute("src"));
  expect(headerImage?.getAttribute("src")).toContain("seed=question-1");
});
