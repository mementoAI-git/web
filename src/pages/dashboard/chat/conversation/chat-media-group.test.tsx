import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChatMediaGroup } from "./chat-media-group";
import { splitStackedMedia } from "./conversation-assets";

const push = vi.fn();
vi.mock("@/hooks/use-modal", () => ({ useModal: () => ({ push }) }));

const images = (count: number) =>
  Array.from({ length: count }, (_, index) => ({ _id: `f${index}`, name: `${index}.jpg`, type: "image/jpeg", url: `/${index}.jpg`, size: 1 }));

describe("ChatMediaGroup", () => {
  beforeEach(() => push.mockClear());

  it("uses the prominent single-image layout", () => {
    render(<ChatMediaGroup attachments={[{ _id: "f1", name: "one.jpg", type: "image/jpeg", url: "/one.jpg", size: 1 }]} />);
    expect(screen.getByTestId("chat-media-group").querySelector('[data-layout="single"]')).toBeInTheDocument();
  });

  it.each([2, 3])("stacks %i visual items with the first in front", (count) => {
    render(<ChatMediaGroup attachments={images(count)} />);
    expect(screen.getByTestId("chat-media-group").querySelector('[data-layout="stack"]')).toBeInTheDocument();
    const tiles = screen.getAllByRole("button", { name: /in viewer/i });
    expect(tiles).toHaveLength(count);
    expect(tiles[0]).toHaveClass("z-10", "-rotate-6", "absolute");
    expect(tiles[1]).toHaveClass("rotate-8");
  });

  it("switches to the grid at four visual items", () => {
    render(<ChatMediaGroup attachments={images(4)} />);
    expect(screen.getByTestId("chat-media-group").querySelector('[data-layout="grid"]')).toBeInTheDocument();
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
  });

  it("moves only 1-3 visual items out of the bubble", () => {
    const doc = { _id: "d1", name: "notes.pdf", type: "application/pdf", url: "/notes.pdf", size: 1 };
    const three = images(3);
    expect(splitStackedMedia([three[0], doc, three[1], three[2]])).toEqual({ stacked: three, inline: [doc] });
    const four = images(4);
    expect(splitStackedMedia(four)).toEqual({ stacked: [], inline: four });
    expect(splitStackedMedia([doc])).toEqual({ stacked: [], inline: [doc] });
  });

  it("shows four tiles and the remaining count, then opens the exact item", async () => {
    const files = Array.from({ length: 6 }, (_, index) => ({ _id: `f${index}`, name: `${index}.jpg`, type: "image/jpeg", url: `/${index}.jpg`, size: 1 }));
    render(<ChatMediaGroup attachments={files} sharedAt="2026-07-13T13:34:00.000Z" />);
    expect(screen.getAllByRole("button", { name: /in viewer/i })).toHaveLength(4);
    expect(screen.getByText("+2")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /open 2.jpg in viewer/i }));
    expect(push).toHaveBeenCalledWith("file-preview", {
      files: files.map((file) => ({ ...file, sharedAt: "2026-07-13T13:34:00.000Z" })),
      startIndex: 2,
    });
  });

  it("renders audio as a playable voice tile and documents as compact rows", () => {
    render(<ChatMediaGroup attachments={[
      { _id: "a1", name: "voice.m4a", type: "audio/mp4", url: "/voice.m4a", size: 1 },
      { _id: "d1", name: "notes.pdf", type: "application/pdf", url: "/notes.pdf", size: 1 },
    ]} />);
    expect(screen.getByTestId("voice-note-tile")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play voice note" })).toBeInTheDocument();
    expect(screen.getByText("application/pdf")).toBeInTheDocument();
  });
});
