import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { vi } from "vitest";
import { SWRConfig } from "swr";
import { fetcher } from "@/api/fetcher";
import { server } from "@/test";
import { PublishSuccessView } from "./publish-success-view";
import { SharePost } from "./share-post";

const { copy, open, close } = vi.hoisted(() => ({ copy: vi.fn(), open: vi.fn(), close: vi.fn() }));
vi.mock("@/hooks/use-copy", () => ({ default: () => [false, copy] }));
vi.mock("@/hooks/use-modal", () => ({ useModal: () => ({ open, close }) }));

beforeEach(() => vi.clearAllMocks());

const API = "http://localhost:3000/api";
const serveStory = (visibility: "everyone" | "private") =>
  server.use(
    http.get(`${API}/memories/story-1`, () =>
      HttpResponse.json({ success: true, data: { _id: "story-1", title: "T", status: "save", visibility } }),
    ),
  );
// Real data fetching for the share gate, with a fresh cache per test.
const renderWithData = (ui: React.ReactElement) =>
  render(<SWRConfig value={{ fetcher, provider: () => new Map(), dedupingInterval: 0 }}>{ui}</SWRConfig>);

it("shares the saved conversation link with conversation-specific copy", async () => {
  render(<SharePost data={{ id: "conversation-1", kind: "conversation" }} />);
  expect(screen.getByRole("heading", { name: "Share conversation" })).toBeInTheDocument();
  expect(screen.queryByText("Story added successfully")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Add story" })).not.toBeInTheDocument();
  await userEvent.setup().click(screen.getByRole("button", { name: "Copy" }));
  expect(copy).toHaveBeenCalledWith(`${window.location.origin}/post/conversation-1`, "Link copied successfully");
});

it("uses the mobile publish-success view and opens another story", async () => {
  serveStory("everyone");
  renderWithData(<SharePost data={{ id: "story-1" }} />);
  expect(screen.getByRole("heading", { name: "Story published successfully" })).toBeInTheDocument();
  expect(screen.getByText("Share this story with friends")).toBeInTheDocument();
  const user = userEvent.setup();
  // A public story copies straight away once it has loaded.
  await new Promise((resolve) => setTimeout(resolve, 50));
  await user.click(screen.getByRole("button", { name: "Copy story link" }));
  expect(await navigator.clipboard.readText()).toBe(`${window.location.origin}/post/story-1`);
  expect(await screen.findByText("Copied")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Share on X" })).toHaveAttribute("href", `https://x.com/intent/tweet?url=${encodeURIComponent(`${window.location.origin}/post/story-1`)}`);
  await user.click(screen.getByRole("button", { name: "Add another story" }));
  expect(close).toHaveBeenCalledWith("share-post");
  expect(open).toHaveBeenCalledWith("create-memory");
});

it("asks before sharing a new private story's link", async () => {
  serveStory("private");
  const popup = vi.spyOn(window, "open").mockImplementation(() => null);
  renderWithData(<SharePost data={{ id: "story-1" }} />);
  const user = userEvent.setup();
  await new Promise((resolve) => setTimeout(resolve, 50));
  await user.click(screen.getByRole("link", { name: "Share on X" }));
  expect(await screen.findByRole("alertdialog", { name: "Make this story public?" })).toBeVisible();
  expect(popup).not.toHaveBeenCalled();
  popup.mockRestore();
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
