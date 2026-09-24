import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FilePreview from ".";

const close = vi.fn();
vi.mock("focus-trap-react", () => ({ default: ({ children }: { children: React.ReactNode }) => children }));
vi.mock("@/hooks/use-modal", () => ({ useModal: () => ({ close }) }));
vi.mock("@/hooks/use-fetcher", () => ({ default: () => ({ trigger: vi.fn(), isMutating: false }) }));
vi.mock("@/features/media/signed-media-access", () => ({ useSignedMediaAccess: (file: { url: string }) => ({ src: file.url, onError: vi.fn() }) }));

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
});
