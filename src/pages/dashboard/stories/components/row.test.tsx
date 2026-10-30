import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import type { IFile, IMemory } from "@/utility/interface";
import StoriesTableRow from "./row";

vi.mock("./dropdown", () => ({
  MemoryItemActions: () => <button>Story actions</button>,
}));
vi.mock("@/hooks/use-modal", () => ({ useModal: () => ({ open: vi.fn() }) }));
const file = (overrides: Partial<IFile>): IFile => ({
  _id: "file-1",
  name: "photo.webp",
  type: "image/webp",
  url: "https://example.com/photo.webp",
  size: 100,
  ...overrides,
});
function preview(attachments: IFile[]) {
  const memory = {
    _id: "story-1",
    title: "My story",
    tags: [],
    attachments,
    created_at: "2026-10-07",
  } as unknown as IMemory;
  const result = render(
    <MemoryRouter>
      <table>
        <tbody>
          <StoriesTableRow memory={memory} />
        </tbody>
      </table>
    </MemoryRouter>,
  );
  return result.container.querySelector("img")!;
}
const fallback = "https://api.dicebear.com/10.x/disco/svg?seed=story-1";
describe("story table thumbnails", () => {
  it("shows the image even when an audio attachment comes first", () => {
    expect(
      preview([file({ name: "audio.mp3", type: "audio/mpeg" }), file({})]),
    ).toHaveAttribute("src", "https://example.com/photo.webp");
  });
  it("uses generated thumbnails for video attachments", () => {
    expect(
      preview([
        file({
          name: "clip.mp4",
          type: "video/mp4",
          thumbnail: "https://example.com/preview.webp",
        }),
      ]),
    ).toHaveAttribute("src", "https://example.com/preview.webp");
  });
  it("uses the Explore Disco identicon when there is no media", () => {
    expect(preview([])).toHaveAttribute("src", fallback);
  });
  it("uses the identicon for audio without a thumbnail", () => {
    expect(
      preview([file({ name: "audio.mp3", type: "audio/mpeg" })]),
    ).toHaveAttribute("src", fallback);
  });
  it("falls back to the identicon when the thumbnail cannot load", async () => {
    const image = preview([file({})]);
    fireEvent.error(image);
    await waitFor(() => expect(image).toHaveAttribute("src", fallback));
  });
  it("shows actual deletion time and recovery deadline in Deleted, not creation time", () => {
    const memory = { _id: "deleted-1", title: "Deleted story", status: "deleted", tags: [], attachments: [], created_at: "2020-01-01", deleted_at: "2026-10-15T12:00:00Z", delete_after: "2099-11-14T12:00:00Z" } as unknown as IMemory;
    const { container } = render(<MemoryRouter><table><tbody><StoriesTableRow memory={memory} /></tbody></table></MemoryRouter>);
    expect(screen.getByText("Oct 15, 2026")).toBeInTheDocument();
    expect(screen.queryByText("Jan 01, 2020")).not.toBeInTheDocument();
    expect(container.querySelector('time[datetime="2099-11-14T12:00:00Z"]')).toHaveTextContent("Permanently deletes in");
  });

});
