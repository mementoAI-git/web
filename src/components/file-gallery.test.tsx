import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import FileGallery from "./file-gallery";

const push = vi.hoisted(() => vi.fn());
const onError = vi.hoisted(() => vi.fn());
const pdfMocks = vi.hoisted(() => ({
  getDocument: vi.fn(),
  getPage: vi.fn(),
  destroy: vi.fn(),
}));
vi.mock("pdfjs-dist", () => ({
  getDocument: pdfMocks.getDocument,
  GlobalWorkerOptions: {},
}));
vi.mock("@/hooks/use-modal", () => ({ useModal: () => ({ push }) }));
vi.mock("@/features/media/signed-media-access", () => ({
  useSignedMediaAccess: (file: { url: string }) => ({
    attachment: file,
    src: file.url,
    onError,
  }),
}));
const video = {
  _id: "v1",
  name: "clip.mov",
  type: "video/quicktime",
  url: "/clip.mov",
  size: 100,
  duration: 6,
};
afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("stacked story attachments", () => {
  it("shows three keyboard-accessible previews and opens the full gallery at the selected file", () => {
    const files = Array.from({ length: 4 }, (_, index) => ({
      _id: `photo-${index}`,
      name: `photo-${index}.jpg`,
      type: "image/jpeg",
      url: `/photo-${index}.jpg`,
      size: 100,
    }));
    render(<FileGallery files={files} variant="stacked" />);
    expect(screen.getAllByRole("button")).toHaveLength(3);
    fireEvent.click(
      screen.getByRole("button", { name: "Open attachment 2: photo-1.jpg" }),
    );
    expect(push).toHaveBeenCalledWith("file-preview", { files, startIndex: 1 });
  });
});

describe("video gallery thumbnails", () => {
  it("uses the provided poster instead of an audio waveform", () => {
    render(<FileGallery files={[{ ...video, thumbnail: "/poster.jpg" }]} />);
    expect(
      screen.getByRole("img", { name: "Preview of clip.mov" }),
    ).toHaveAttribute("src", "/poster.jpg");
    expect(screen.queryByRole("img", { name: "wave" })).not.toBeInTheDocument();
  });

  it("falls back to a video frame if the supplied poster fails", () => {
    render(
      <FileGallery files={[{ ...video, thumbnail: "/missing-poster.jpg" }]} />,
    );
    fireEvent.error(screen.getByRole("img", { name: "Preview of clip.mov" }));
    expect(
      screen.getByLabelText("Video thumbnail for clip.mov"),
    ).toHaveAttribute("src", "/clip.mov");
  });

  it("shows a preview frame when there is no poster and opens the viewer", () => {
    render(<FileGallery files={[{ ...video, type: "" }]} />);
    const preview = screen.getByLabelText(
      "Video thumbnail for clip.mov",
    ) as HTMLVideoElement;
    Object.defineProperty(preview, "duration", { value: 6 });
    fireEvent.loadedMetadata(preview);
    expect(preview.currentTime).toBeGreaterThan(0);
    expect(preview.muted).toBe(true);
    fireEvent.click(preview);
    expect(push).toHaveBeenCalledWith("file-preview", {
      files: [{ ...video, type: "" }],
      startIndex: 0,
    });
  });
});

describe("document gallery thumbnails", () => {
  it("shows a safe excerpt for text files and opens them in the viewer", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("First line\n<script>this is text</script>"),
    );
    const text = {
      ...video,
      name: "notes.txt",
      type: "text/plain",
      url: "/notes.txt",
    };
    const { container } = render(<FileGallery files={[text]} />);
    const excerpt = await screen.findByText(/First line/);
    expect(excerpt).toHaveTextContent("<script>this is text</script>");
    expect(container.querySelector("script")).toBeNull();
    fireEvent.click(excerpt);
    expect(push).toHaveBeenCalledWith("file-preview", {
      files: [text],
      startIndex: 0,
    });
  });

  it("renders the first page of a PDF as its thumbnail", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(new Uint8Array([1, 2])),
    );
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      {} as CanvasRenderingContext2D,
    );
    pdfMocks.destroy.mockResolvedValue(undefined);
    pdfMocks.getPage.mockResolvedValue({
      getViewport: ({ scale }: { scale: number }) => ({
        width: 500 * scale,
        height: 700 * scale,
      }),
      render: () => ({ promise: Promise.resolve(), cancel: vi.fn() }),
    });
    pdfMocks.getDocument.mockReturnValue({
      promise: Promise.resolve({ getPage: pdfMocks.getPage }),
      destroy: pdfMocks.destroy,
    });
    render(
      <FileGallery
        files={[
          {
            ...video,
            name: "report.pdf",
            type: "application/pdf",
            url: "/report.pdf",
          },
        ]}
      />,
    );
    expect(
      await screen.findByRole("img", { name: "First page of report.pdf" }),
    ).toBeVisible();
    expect(pdfMocks.getPage).toHaveBeenCalledWith(1);
  });
});
