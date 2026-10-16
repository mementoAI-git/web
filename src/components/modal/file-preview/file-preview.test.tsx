import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FilePreview from ".";

const close = vi.fn();
const refreshSignedMedia = vi.hoisted(() => vi.fn());
vi.mock("focus-trap-react", () => ({ default: ({ children }: { children: React.ReactNode }) => children }));
vi.mock("@/hooks/use-modal", () => ({ useModal: () => ({ close }) }));
vi.mock("@/hooks/use-fetcher", () => ({ default: () => ({ trigger: vi.fn(), isMutating: false }) }));
vi.mock("@/features/media/signed-media-access", () => ({ useSignedMediaAccess: (file: { url: string }) => ({ src: file.url, onError: refreshSignedMedia }) }));

const files = [
  { _id: "f1", name: "first.jpg", type: "image/jpeg", url: "/first.jpg", size: 10, sharedAt: "2026-07-13T13:34:00.000Z" },
  { _id: "f2", name: "second.jpg", type: "image/jpeg", url: "/second.jpg", size: 10, sharedAt: "2026-07-14T10:00:00.000Z" },
];

describe("FilePreview", () => {
  beforeEach(() => close.mockClear());

  it("starts at the requested item and shows supported actions", () => {
    render(<FilePreview data={{ files, startIndex: 1 }} />);
    expect(screen.getByRole("dialog", { name: "Preview second.jpg" })).toBeInTheDocument();
    expect(screen.getByText(/Shared Jul 14, 2026 at \d{1,2}:00 AM/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete file" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download file" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close viewer" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "second.jpg" })).toHaveClass("object-contain");
  });

  it("navigates with controls, dots, and horizontal arrow keys", async () => {
    render(<FilePreview data={{ files, startIndex: 0 }} />);
    await userEvent.click(screen.getByRole("button", { name: "Next file" }));
    expect(screen.getByRole("dialog", { name: "Preview second.jpg" })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(screen.getByRole("dialog", { name: "Preview first.jpg" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Show file 2" }));
    expect(screen.getByRole("dialog", { name: "Preview second.jpg" })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "ArrowUp" });
    expect(screen.getByRole("dialog", { name: "Preview second.jpg" })).toBeInTheDocument();
  });

  it("hides navigation and delete for one transient file", () => {
    render(<FilePreview data={{ files: [{ ...files[0], _id: "" }] }} />);
    expect(screen.queryByRole("button", { name: "Previous file" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Show file 1" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete file" })).not.toBeInTheDocument();
  });

  it("clamps an out-of-range start index", () => {
    render(<FilePreview data={{ files, startIndex: 99 }} />);
    expect(screen.getByRole("dialog", { name: "Preview second.jpg" })).toBeInTheDocument();
  });

  it("closes on empty backdrop clicks but not media or toolbar clicks", async () => {
    render(<FilePreview data={{ files }} />);
    await userEvent.click(screen.getByRole("img", { name: "first.jpg" }));
    await userEvent.click(screen.getByText("first.jpg"));
    expect(close).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("dialog"));
    expect(close).toHaveBeenCalledWith("file-preview");
  });

  it("closes when clicking the padding around the media", () => {
    render(<FilePreview data={{ files }} />);
    fireEvent.click(screen.getByRole("img", { name: "first.jpg" }).parentElement!.parentElement!);
    expect(close).toHaveBeenCalledWith("file-preview");
  });

  it("renders text documents as readable text instead of broken images", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("First line\n<script>plain text</script>"));
    try {
      render(<FilePreview data={{ files: [{ ...files[0], name: "notes.txt", type: "text/plain" }] }} />);
      expect(await screen.findByText(/First line/)).toHaveTextContent("<script>plain text</script>");
      expect(screen.queryByRole("img", { name: "notes.txt" })).not.toBeInTheDocument();
      expect(document.querySelector("script")).not.toBeInTheDocument();
    } finally {
      fetchMock.mockRestore();
    }
  });

  it("provides a clear fallback for unsupported documents", () => {
    render(<FilePreview data={{ files: [{ ...files[0], name: "report.docx", type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }] }} />);
    expect(screen.getByText(/Download this file to view it/)).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "report.docx" })).not.toBeInTheDocument();
  });

  it("keeps document arrow keys inside the readable content", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("Readable notes"));
    try {
      render(<FilePreview data={{ files: [{ ...files[0], name: "notes.txt", type: "text/plain" }, files[1]] }} />);
      await screen.findByText("Readable notes");
      fireEvent.keyDown(screen.getByLabelText("Text document content"), { key: "ArrowRight" });
      expect(screen.getByRole("dialog", { name: "Preview notes.txt" })).toBeInTheDocument();
    } finally { fetchMock.mockRestore(); }
  });

  it("disables navigation at the boundaries and updates the selected position", async () => {
    render(<FilePreview data={{ files }} />);
    expect(screen.getByRole("button", { name: "Previous file" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Show file 1" })).toHaveAttribute("aria-current", "true");
    await userEvent.click(screen.getByRole("button", { name: "Next file" }));
    expect(screen.getByRole("button", { name: "Next file" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Previous file" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Show file 2" })).toHaveAttribute("aria-current", "true");
  });

  it("exposes download progress and prevents duplicate downloads", async () => {
    let finish!: (response: Response) => void;
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(() => new Promise<Response>((resolve) => { finish = resolve; }));
    const consoleMock = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      render(<FilePreview data={{ files }} />);
      const download = screen.getByRole("button", { name: "Download file" });
      await userEvent.click(download);
      expect(download).toBeDisabled();
      expect(download).toHaveAttribute("aria-busy", "true");
      await userEvent.click(download);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      finish(new Response(null, { status: 500 }));
      await waitFor(() => expect(download).toBeEnabled());
      expect(download).toHaveAttribute("aria-busy", "false");
    } finally {
      fetchMock.mockRestore();
      consoleMock.mockRestore();
    }
  });
});
