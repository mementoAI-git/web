import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test";
import type { IFile, IMemory } from "@/utility/interface";
import { StoriesList } from "./list";

const open = vi.fn();
vi.mock("@/hooks/use-modal", async (original) => ({
  ...(await original<typeof import("@/hooks/use-modal")>()),
  useModal: () => ({ open }),
}));

const memory = {
  _id: "story-1",
  title: "Quick note",
  body: "<p>The body text</p>",
  summary: "An AI summary",
  tags: ["Music", "Learning", "Family"],
  attachments: [],
  status: "published",
  created_at: "2026-11-06T12:00:00.000Z",
} as unknown as IMemory;

describe("StoriesList", () => {
  it("shows only the title and date in a weak-fill card with the identicon thumbnail", () => {
    const { container } = renderWithProviders(
      <StoriesList data={{ docs: [memory] } as never} />,
      { route: "/stories", auth: true },
    );

    expect(screen.getByRole("heading", { name: "Quick note" })).toBeVisible();
    expect(screen.getByText("Nov 06, 2026")).toBeVisible();
    for (const hidden of ["Music", "Learning", "+1", "An AI summary", "The body text"]) {
      expect(screen.queryByText(hidden)).not.toBeInTheDocument();
    }
    expect(container.querySelector("article")).toHaveClass("rounded-2xl", "bg-fill-neutral-weak");
    expect(container.querySelector("article img")).toHaveAttribute(
      "src",
      "https://api.dicebear.com/10.x/disco/svg?seed=story-1",
    );
    expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument();
  });

  it("is a list of card strips, not a table", () => {
    renderWithProviders(<StoriesList data={{ docs: [memory, { ...memory, _id: "story-2" }] } as never} />, {
      route: "/stories",
      auth: true,
    });
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader")).not.toBeInTheDocument();
    expect(document.querySelectorAll("article")).toHaveLength(2);
  });

  it("opens the story viewer on wider screens", async () => {
    open.mockClear();
    renderWithProviders(<StoriesList data={{ docs: [memory] } as never} />, { route: "/stories", auth: true });
    await userEvent.click(screen.getByRole("heading", { name: "Quick note" }));
    expect(open).toHaveBeenCalledWith("view-memory", { memoryId: "story-1" });
  });

  it("doesn't open a deleted story, and shows when it was deleted and when it goes for good", () => {
    open.mockClear();
    const deleted = { ...memory, status: "deleted", created_at: "2020-01-01", deleted_at: "2026-10-15T12:00:00Z", delete_after: "2099-11-14T12:00:00Z" } as unknown as IMemory;
    const { container } = renderWithProviders(<StoriesList data={{ docs: [deleted] } as never} />, { route: "/stories", auth: true });
    fireEvent.click(screen.getByRole("heading", { name: "Quick note" }));
    expect(open).not.toHaveBeenCalled();
    expect(screen.getByText("Oct 15, 2026")).toBeInTheDocument();
    expect(screen.queryByText("Jan 01, 2020")).not.toBeInTheDocument();
    expect(container.querySelector('time[datetime="2099-11-14T12:00:00Z"]')).toHaveTextContent("Permanently deletes in");
  });
});

const file = (overrides: Partial<IFile>): IFile => ({
  _id: "file-1",
  name: "photo.webp",
  type: "image/webp",
  url: "https://example.com/photo.webp",
  size: 100,
  ...overrides,
});
function thumbnail(attachments: IFile[]) {
  const { container } = renderWithProviders(
    <StoriesList data={{ docs: [{ ...memory, attachments }] } as never} />,
    { route: "/stories", auth: true },
  );
  return container.querySelector("article img")!;
}
const fallback = "https://api.dicebear.com/10.x/disco/svg?seed=story-1";
describe("story card thumbnails", () => {
  it("shows the image even when an audio attachment comes first", () => {
    expect(thumbnail([file({ name: "audio.mp3", type: "audio/mpeg" }), file({})])).toHaveAttribute("src", "https://example.com/photo.webp");
  });
  it("uses generated thumbnails for video attachments", () => {
    expect(thumbnail([file({ name: "clip.mp4", type: "video/mp4", thumbnail: "https://example.com/preview.webp" })])).toHaveAttribute("src", "https://example.com/preview.webp");
  });
  it("uses the identicon for audio without a thumbnail", () => {
    expect(thumbnail([file({ name: "audio.mp3", type: "audio/mpeg" })])).toHaveAttribute("src", fallback);
  });
  it("falls back to the identicon when the thumbnail cannot load", async () => {
    const image = thumbnail([file({})]);
    fireEvent.error(image);
    await waitFor(() => expect(image).toHaveAttribute("src", fallback));
  });
});
