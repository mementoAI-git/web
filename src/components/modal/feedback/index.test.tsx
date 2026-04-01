import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test";
import { Feedback } from "./index";
import type { IOnUploadPayload } from "@/utility/interface";

vi.mock("@/hooks/use-fetcher", () => ({
  default: () => ({
    trigger: vi.fn().mockResolvedValue({ success: true }),
    isMutating: false,
  }),
}));

const uploadState: {
  files: IOnUploadPayload[];
  handleUpload: ReturnType<typeof vi.fn>;
  handleDeleteFile: ReturnType<typeof vi.fn>;
  setFiles: ReturnType<typeof vi.fn>;
} = {
  files: [],
  handleUpload: vi.fn(),
  handleDeleteFile: vi.fn(),
  setFiles: vi.fn(),
};

vi.mock("@/hooks/use-file-upload", () => ({
  default: () => ({
    files: uploadState.files,
    handleUpload: uploadState.handleUpload,
    handleDeleteFile: uploadState.handleDeleteFile,
    setFiles: uploadState.setFiles,
  }),
}));

describe("Feedback", () => {
  beforeEach(() => {
    uploadState.files = [];
    uploadState.handleUpload.mockReset();
    uploadState.handleDeleteFile.mockReset();
    uploadState.setFiles.mockReset();
    vi.stubGlobal("navigator", {
      ...navigator,
      clipboard: {
        read: vi.fn().mockRejectedValue(new Error("denied")),
        writeText: vi.fn(),
      },
    });
  });

  it("renders desktop modal with 500px width and 24px padding utilities", async () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 800,
    });

    const { container } = renderWithProviders(<Feedback data={{}} />, {
      auth: true,
    });

    await screen.findByRole("heading", { name: /send feedback/i });

    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /choose images/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^close$/i })).toBeInTheDocument();

    const modal = container.querySelector(".modal-container");
    expect(modal).toBeTruthy();
    expect(modal?.className).toContain("!w-[500px]");
    expect(modal?.className).toContain("!min-w-[500px]");
    expect(modal?.className).toContain("!max-w-[500px]");
    expect(modal?.className).toContain("!p-6");
  });

  it("wraps form content in full-width stacks", async () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 800,
    });

    const { container } = renderWithProviders(<Feedback data={{}} />, {
      auth: true,
    });

    await screen.findByRole("heading", { name: /send feedback/i });
    const stacks = container.querySelectorAll(".modal-container .w-full.space-y-4");
    expect(stacks.length).toBeGreaterThanOrEqual(1);
  });

  it("renders thumbnail grid, image preview, and remove control for screenshots", async () => {
    const user = userEvent.setup();
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 800,
    });

    uploadState.files = [
      {
        id: "thumb-1",
        file: new File(["x"], "image.png", { type: "image/png" }),
        base64: "data:image/png;base64,AAA",
        progress: 100,
        uploadedFile: {
          _id: "uf1",
          name: "image.png",
          url: "https://example.com/image.png",
          size: 1,
        },
      },
    ];

    const { container } = renderWithProviders(<Feedback data={{}} />, {
      auth: true,
    });

    await screen.findByRole("heading", { name: /send feedback/i });

    expect(container.querySelector("img[alt='image.png']")).toBeTruthy();

    const remove = screen.getByRole("button", { name: /remove image\.png/i });
    expect(remove).toHaveClass("rounded-full");
    await user.click(remove);
    expect(uploadState.handleDeleteFile).toHaveBeenCalledTimes(1);
    expect(uploadState.handleDeleteFile).toHaveBeenCalledWith(
      expect.objectContaining({ id: "thumb-1" }),
    );
  });
});
