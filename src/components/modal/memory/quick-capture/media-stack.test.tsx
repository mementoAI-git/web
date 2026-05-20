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
      <QuickCaptureMediaStack files={files} voiceNoteIds={{}} onRemove={onRemove} />
    );

    const images = container.querySelectorAll("img");
    expect(images).toHaveLength(1);
    expect(screen.queryByText(/\+.*more/)).toBeNull();

    // Verify grid container classes
    const gridContainer = container.querySelector(".grid");
    expect(gridContainer).toHaveClass("grid-cols-1");
  });

  it("renders 3 images with the third stretching to full width (col-span-2)", () => {
    const files = [
      createImageFile("img-1", "one.png"),
      createImageFile("img-2", "two.png"),
      createImageFile("img-3", "three.png"),
    ];
    const { container } = renderWithProviders(
      <QuickCaptureMediaStack files={files} voiceNoteIds={{}} onRemove={onRemove} />
    );

    const images = container.querySelectorAll("img");
    expect(images).toHaveLength(3);
    expect(screen.queryByText(/\+.*more/)).toBeNull();

    const gridContainer = container.querySelector(".grid");
    expect(gridContainer).toHaveClass("grid-cols-2");

    // The third image wrapper should have col-span-2 aspect-[2/1]
    const thirdWrapper = images[2].closest(".col-span-2");
    expect(thirdWrapper).toBeTruthy();
    expect(thirdWrapper).toHaveClass("col-span-2");
    expect(thirdWrapper).toHaveClass("aspect-[2/1]");
  });

  it("renders 4 images in a 2x2 grid without any overlay", () => {
    const files = [
      createImageFile("img-1", "one.png"),
      createImageFile("img-2", "two.png"),
      createImageFile("img-3", "three.png"),
      createImageFile("img-4", "four.png"),
    ];
    const { container } = renderWithProviders(
      <QuickCaptureMediaStack files={files} voiceNoteIds={{}} onRemove={onRemove} />
    );

    const images = container.querySelectorAll("img");
    expect(images).toHaveLength(4);
    expect(screen.queryByText(/\+.*more/)).toBeNull();
  });

  it("renders only 4 images and shows +2 more overlay when 6 images are provided", () => {
    const files = [
      createImageFile("img-1", "one.png"),
      createImageFile("img-2", "two.png"),
      createImageFile("img-3", "three.png"),
      createImageFile("img-4", "four.png"),
      createImageFile("img-5", "five.png"),
      createImageFile("img-6", "six.png"),
    ];
    const { container } = renderWithProviders(
      <QuickCaptureMediaStack files={files} voiceNoteIds={{}} onRemove={onRemove} />
    );

    // Only up to 4 images should be sliced and rendered
    const images = container.querySelectorAll("img");
    expect(images).toHaveLength(4);

    // Should display '+2 more' text
    const overlay = screen.getByText("+2 more");
    expect(overlay).toBeInTheDocument();
    expect(overlay.closest(".absolute")).toHaveClass("bg-black/60");
  });

  it("triggers onRemove when delete button is clicked on an image", async () => {
    const user = userEvent.setup();
    const files = [createImageFile("img-1", "one.png")];
    renderWithProviders(
      <QuickCaptureMediaStack files={files} voiceNoteIds={{}} onRemove={onRemove} />
    );

    const deleteBtn = screen.getByRole("button", { name: /remove attachment/i });
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
      <QuickCaptureMediaStack files={files} voiceNoteIds={{}} onRemove={onRemove} />
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
