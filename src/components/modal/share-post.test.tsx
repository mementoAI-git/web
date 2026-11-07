import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { PublishSuccessView } from "./publish-success-view";
import { SharePost } from "./share-post";

const { copy, open, close } = vi.hoisted(() => ({ copy: vi.fn(), open: vi.fn(), close: vi.fn() }));
vi.mock("@/hooks/use-copy", () => ({ default: () => [false, copy] }));
vi.mock("@/hooks/use-modal", () => ({ useModal: () => ({ open, close }) }));

beforeEach(() => vi.clearAllMocks());

it("shares the saved conversation link with conversation-specific copy", async () => {
  render(<SharePost data={{ id: "conversation-1", kind: "conversation" }} />);
  expect(screen.getByRole("heading", { name: "Share conversation" })).toBeInTheDocument();
  expect(screen.queryByText("Story added successfully")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Add story" })).not.toBeInTheDocument();
  await userEvent.setup().click(screen.getByRole("button", { name: "Copy" }));
  expect(copy).toHaveBeenCalledWith(`${window.location.origin}/post/conversation-1`, "Link copied successfully");
});

it("uses the mobile publish-success view and opens another story", async () => {
  render(<SharePost data={{ id: "story-1" }} />);
  expect(screen.getByRole("heading", { name: "Story published successfully" })).toBeInTheDocument();
  expect(screen.getByText("Share this story with friends")).toBeInTheDocument();
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Copy story link" }));
  expect(await navigator.clipboard.readText()).toBe(`${window.location.origin}/post/story-1`);
  expect(screen.getByText("Copied")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Share on X" })).toHaveAttribute("href", `https://x.com/intent/tweet?url=${encodeURIComponent(`${window.location.origin}/post/story-1`)}`);
  await user.click(screen.getByRole("button", { name: "Add another story" }));
  expect(close).toHaveBeenCalledWith("share-post");
  expect(open).toHaveBeenCalledWith("create-memory");
});

it("shows the link without a notice about who can open it", () => {
  render(<SharePost data={{ id: "story-1" }} />);
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(screen.queryByText(/can read this story|only you can open/i)).not.toBeInTheDocument();
});

it("leaves the rays to the bottom sheet, so they sit behind its whole surface", () => {
  const props = { publishedUrl: "https://x.test/post/1", onDismiss: vi.fn(), onAddAnother: vi.fn() };
  const { unmount } = render(<PublishSuccessView {...props} />);
  expect(screen.getByTestId("publish-success-rays")).toBeInTheDocument();
  unmount();
  render(<PublishSuccessView {...props} sheet />);
  expect(screen.queryByTestId("publish-success-rays")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Add another story" })).toBeInTheDocument();
});
