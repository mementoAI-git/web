import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test";
import { QuickCaptureMediaStack } from "./media-stack";
import type { IOnUploadPayload } from "@/utility/interface";

describe("QuickCaptureMediaStack", () => {
  const onRemove = vi.fn();

  const createImageFile = (id: string, name: string): IOnUploadPayload => ({
    id,
    file: new File(["x"], name, { type: "image/png" }),
    base64: `data:image/png;base64,${id}`,
    progress: 100,
    uploadedFile: {
      _id: id,
      name,
      url: `https://example.com/${name}`,
      size: 100,
    },
  });

  const createVideoFile = (id: string, name: string): IOnUploadPayload => ({
    id,
    file: new File(["x"], name, { type: "video/mp4" }),
    progress: 100,
    uploadedFile: {
      _id: id,
      name,
      url: `https://example.com/${name}`,
      size: 1000,
    },
  });

  beforeEach(() => {
    onRemove.mockReset();
  });

  it("renders a single image as a full-width item without overlay", () => {
    const files = [createImageFile("img-1", "one.png")];
    const { container } = renderWithProviders(
      <QuickCaptureMediaStack
        files={files}
        voiceNoteIds={{}}
        onRemove={onRemove}
      />,
    );

    const images = container.querySelectorAll("img");
    expect(images).toHaveLength(1);
    expect(screen.queryByText(/\+.*more/)).toBeNull();

    // Verify grid container classes
    const gridContainer = container.querySelector(".grid");
    expect(gridContainer).toHaveClass("grid-cols-1");
  });

  it("renders three images without hiding attachments", () => {
    const files = [
      createImageFile("1", "one.png"),
      createImageFile("2", "two.png"),
      createImageFile("3", "three.png"),
    ];
    renderWithProviders(
      <QuickCaptureMediaStack
        files={files}
        voiceNoteIds={{}}
        onRemove={onRemove}
      />,
    );
    expect(screen.getAllByRole("img")).toHaveLength(3);
    expect(screen.queryByText(/more/)).not.toBeInTheDocument();
  });

  it("renders 4 images in a 2x2 grid without any overlay", () => {
    const files = [
      createImageFile("img-1", "one.png"),
      createImageFile("img-2", "two.png"),
      createImageFile("img-3", "three.png"),
      createImageFile("img-4", "four.png"),
    ];
    const { container } = renderWithProviders(
      <QuickCaptureMediaStack
        files={files}
        voiceNoteIds={{}}
        onRemove={onRemove}
      />,
    );

    const images = container.querySelectorAll("img");
    expect(images).toHaveLength(4);
    expect(screen.queryByText(/\+.*more/)).toBeNull();
  });

  it("shows five collage tiles and lets users expand and remove hidden attachments", async () => {
    const user = userEvent.setup();
    const files = Array.from({ length: 10 }, (_, i) =>
      createImageFile(`img-${i}`, `${i}.png`),
    );
    const { container } = renderWithProviders(
      <QuickCaptureMediaStack
        files={files}
        voiceNoteIds={{}}
        onRemove={onRemove}
      />,
    );
    expect(screen.getAllByRole("img")).toHaveLength(5);
    expect(container.querySelector(".row-span-2")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "+5 more" }));
    expect(screen.getAllByRole("img")).toHaveLength(10);
    await user.click(
      screen.getAllByRole("button", { name: "Remove attachment" })[9],
    );
    expect(onRemove).toHaveBeenCalledWith("img-9");
  });

  it("triggers onRemove when delete button is clicked on an image", async () => {
    const user = userEvent.setup();
    const files = [createImageFile("img-1", "one.png")];
    renderWithProviders(
      <QuickCaptureMediaStack
        files={files}
        voiceNoteIds={{}}
        onRemove={onRemove}
      />,
    );

    const deleteBtn = screen.getByRole("button", {
      name: /remove attachment/i,
    });
    expect(deleteBtn).toBeInTheDocument();

    await user.click(deleteBtn);
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onRemove).toHaveBeenCalledWith("img-1");
  });

  it("renders a non-image file such as a video below or separately from images", () => {
    const files = [
      createImageFile("img-1", "one.png"),
      createVideoFile("vid-1", "movie.mp4"),
    ];
    const { container } = renderWithProviders(
      <QuickCaptureMediaStack
        files={files}
        voiceNoteIds={{}}
        onRemove={onRemove}
      />,
    );

    // Verify image rendered in grid
    const images = container.querySelectorAll("img");
    expect(images).toHaveLength(1);

    // Verify video rendered
    const video = container.querySelector("video");
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute("src", "https://example.com/movie.mp4");
  });
});
