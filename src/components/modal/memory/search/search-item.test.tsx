import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { Command, CommandList } from "@/components/ui/command";
import type { IFile, IMemory } from "@/utility/interface";
import SearchItem from "./search-item";

const openModal = vi.fn();
const closeModal = vi.fn();
vi.mock("@/hooks/use-modal", () => ({
  useModal: () => ({ open: openModal, close: closeModal }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: 1024,
  });
});

function CurrentPath() {
  return <span data-testid="pathname">{useLocation().pathname}</span>;
}

function renderItem(attachments: Partial<IFile>[] = [], type = "story") {
  const memory = {
    _id: "memory-1",
    title: "A day at the beach",
    body: "A sunny afternoon.",
    category: "growing-up",
    created_at: "2026-08-18T12:00:00Z",
    attachments,
    type,
  } as IMemory;
  render(
    <MemoryRouter>
      <CurrentPath />
      <Command>
        <CommandList>
          <SearchItem memory={memory} />
        </CommandList>
      </Command>
    </MemoryRouter>,
  );
  return screen.getByRole("img");
}

beforeAll(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  Element.prototype.scrollIntoView = vi.fn();
});

const fallback = "https://api.dicebear.com/10.x/disco/svg?seed=memory-1";

describe("SearchItem thumbnails", () => {
  it("opens desktop stories in the standard app viewer", () => {
    renderItem([], "story");
    fireEvent.click(screen.getByRole("option"));
    expect(openModal).toHaveBeenCalledWith("view-memory", {
      memoryId: "memory-1",
    });
    expect(screen.getByTestId("pathname").textContent).toBe("/");
  });
  it("keeps the standard mobile story page", () => {
    window.innerWidth = 390;
    renderItem([], "story");
    fireEvent.click(screen.getByRole("option"));
    expect(screen.getByTestId("pathname")).toHaveTextContent(
      "/stories/memory-1",
    );
    expect(openModal).not.toHaveBeenCalled();
    expect(closeModal).toHaveBeenCalledWith("search-memory");
  });
  it("opens chats in their conversation screen", () => {
    renderItem([], "conversation");
    fireEvent.click(screen.getByRole("option"));
    expect(screen.getByTestId("pathname")).toHaveTextContent("/chat/memory-1");
    expect(openModal).not.toHaveBeenCalled();
    expect(closeModal).toHaveBeenCalledWith("search-memory");
  });
  it("uses the first image, skipping earlier audio and video attachments", () => {
    const image = renderItem([
      { type: "audio/mpeg", url: "/voice.mp3" },
      { type: "video/mp4", url: "/video.mp4", thumbnail: "/video-thumb.jpg" },
      { type: "image/jpeg", url: "/first.jpg", name: "Beach" },
      { type: "image/png", url: "/second.png" },
    ]);
    expect(image).toHaveAttribute("src", "/first.jpg");
    expect(image).toHaveAttribute("alt", "Beach");
  });

  it("recognizes older images without MIME metadata", () => {
    const image = renderItem([
      { name: "beach.JPG", url: "/file/123?signature=abc" },
    ]);
    expect(image).toHaveAttribute("src", "/file/123?signature=abc");
  });

  it("recognizes image URLs without filename metadata", () => {
    const image = renderItem([{ url: "/beach.webp?signature=abc" }]);
    expect(image).toHaveAttribute("src", "/beach.webp?signature=abc");
  });

  it.each([
    { attachments: [] },
    { attachments: [{ type: "application/pdf", url: "/notes.pdf" }] },
  ])(
    "uses a stable Disco fallback when there are no images: %j",
    ({ attachments }) => {
      expect(renderItem(attachments)).toHaveAttribute("src", fallback);
    },
  );

  it("falls back once when a post image cannot load", () => {
    const image = renderItem([{ type: "image/jpeg", url: "/missing.jpg" }]);
    fireEvent.error(image);
    expect(image).toHaveAttribute("src", fallback);
    fireEvent.error(image);
    expect(image).toHaveAttribute("src", fallback);
  });
});
