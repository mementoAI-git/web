import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { SharePost } from "./share-post";

const { copy } = vi.hoisted(() => ({ copy: vi.fn() }));
vi.mock("@/hooks/use-copy", () => ({ default: () => [false, copy] }));
vi.mock("@/hooks/use-modal", () => ({ useModal: () => ({ open: vi.fn(), close: vi.fn() }) }));

beforeEach(() => vi.clearAllMocks());

it("shares the saved conversation link with conversation-specific copy", async () => {
  render(<SharePost data={{ id: "conversation-1", kind: "conversation" }} />);
  expect(screen.getByRole("heading", { name: "Share conversation" })).toBeInTheDocument();
  expect(screen.queryByText("Story added successfully")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Add story" })).not.toBeInTheDocument();
  await userEvent.setup().click(screen.getByRole("button", { name: "Copy" }));
  expect(copy).toHaveBeenCalledWith(`${window.location.origin}/post/conversation-1`, "Link copied successfully");
});

it("preserves the add-story success modal", () => {
  render(<SharePost data={{ id: "story-1" }} />);
  expect(screen.getByRole("heading", { name: "Story added successfully" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Add story" })).toBeInTheDocument();
});
