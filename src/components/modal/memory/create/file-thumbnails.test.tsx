import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test";
import { FileThumbnails } from "./file-thumbnails";
import type { IOnUploadPayload } from "@/utility/interface";
import { fireEvent, screen } from "@testing-library/react";

vi.mock("music-metadata", () => ({
  parseBlob: vi.fn(),
  selectCover: vi.fn(),
}));

describe("upload recovery", () => {
  it("offers retry for a failed attachment without removing its tile", () => {
    const file = { id: "failed", file: new File(["image"], "photo.png", { type: "image/png" }), base64: "data:image/png;base64,a", progress: 80, uploadFailed: true };
    const retry = vi.fn();
    renderWithProviders(<FileThumbnails files={[file]} onRemove={vi.fn()} onRetry={retry} />);
    fireEvent.click(screen.getByRole("button", { name: "Retry photo.png" }));
    expect(retry).toHaveBeenCalledWith(file);
  });
  it("shows processing for unconfirmed 100% progress", () => {
    const file = { id: "pending", file: new File(["image"], "photo.png", { type: "image/png" }), base64: "data:image/png;base64,a", progress: 100 };
    renderWithProviders(<FileThumbnails files={[file]} onRemove={vi.fn()} />);
    expect(screen.getByText("Processing")).toBeInTheDocument();
  });
});

vi.mock("pdfjs-dist", () => ({
  getDocument: vi.fn(),
  GlobalWorkerOptions: {},
  version: "test",
}));

function createImageFile(id: string, name: string): IOnUploadPayload {
  return {
    id,
    file: new File(["x"], name, { type: "image/png" }),
    base64: `data:image/png;base64,${id}`,
    progress: 100,
    uploadedFile: {
      _id: id,
      name,
      url: `https://example.com/${name}`,
      size: 1024,
      type: "image/png",
    },
  };
}

function createAudioFile(id: string, name: string): IOnUploadPayload {
  return {
    id,
    file: new File(["x"], name, { type: "audio/mpeg" }),
    progress: 100,
    uploadedFile: {
      _id: id,
      name,
      url: `https://example.com/${name}`,
      size: 2048,
      type: "audio/mpeg",
    },
  };
}

function createVideoFile(id: string, name: string): IOnUploadPayload {
  return {
    id,
    file: new File(["x"], name, { type: "video/mp4" }),
    progress: 100,
    uploadedFile: {
      _id: id,
      name,
      url: `https://example.com/${name}`,
      size: 8192,
      type: "video/mp4",
    },
  };
}

function createDocumentFile(id: string, name: string): IOnUploadPayload {
  return {
    id,
    file: new File(["x"], name, { type: "application/pdf" }),
    progress: 100,
    uploadedFile: {
      _id: id,
      name,
      url: `https://example.com/${name}`,
      size: 4096,
      type: "application/pdf",
    },
  };
}

describe("FileThumbnails", () => {
  it("renders desktop inline uploads in one wrapping flow", () => {
    const files = [
      createImageFile("img-1", "one.png"),
      createAudioFile("audio-1", "voice.mp3"),
      createVideoFile("video-1", "clip.mp4"),
      createDocumentFile("doc-1", "notes.pdf"),
    ];

    const { container } = renderWithProviders(
      <FileThumbnails files={files} onRemove={vi.fn()} variant="media-inline" />,
    );

    const flow = container.querySelector('[data-testid="media-inline-flow"]');
    expect(flow).toBeInTheDocument();
    expect(flow).toHaveClass("flex");
    expect(flow).toHaveClass("flex-wrap");
    expect(container.querySelector('[data-testid="media-inline-file-tile-img-1"]')).toHaveClass("size-[72px]");
    const audioTile = container.querySelector('[data-testid="media-inline-file-tile-audio-1"]');
    expect(audioTile?.querySelector('[data-testid="voice-note-tile"]')).toBeInTheDocument();
    const videoTile = container.querySelector('[data-testid="media-inline-file-tile-video-1"]');
    expect(videoTile).toHaveClass("size-[72px]");
    const documentTile = container.querySelector('[data-testid="media-inline-file-tile-doc-1"]');
    expect(documentTile).toHaveClass("size-[72px]");
  });

  it("keeps all desktop inline uploads visible so every upload stays removable", () => {
    const files = [
      createImageFile("img-1", "one.png"),
      createImageFile("img-2", "two.png"),
      createImageFile("img-3", "three.png"),
      createImageFile("img-4", "four.png"),
      createImageFile("img-5", "five.png"),
      createAudioFile("audio-1", "voice.mp3"),
    ];

    const { container } = renderWithProviders(
      <FileThumbnails files={files} onRemove={vi.fn()} variant="media-inline" />,
    );

    const tiles = container.querySelectorAll('[data-testid^="media-inline-file-tile-"]');
    expect(tiles).toHaveLength(6);
    expect(container.querySelector('[data-testid="media-inline-file-tile-img-5"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="media-inline-file-tile-audio-1"]')).toBeInTheDocument();
  });
});
