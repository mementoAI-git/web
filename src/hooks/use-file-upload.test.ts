import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fileUploadFetcher, deleteFetcher } from "@/api/fetcher";
import useFileUpload from "./use-file-upload";

vi.mock("@/api/fetcher", () => ({
  fileUploadFetcher: vi.fn(),
  deleteFetcher: vi.fn(),
}));

beforeEach(() => vi.clearAllMocks());

describe("file uploads across preview remounts", () => {
  it("retains failed story uploads and retries without duplicating the tile", async () => {
    vi.mocked(fileUploadFetcher).mockResolvedValueOnce({ success: false, data: null, message: "Offline" }).mockResolvedValueOnce({ success: true, message: "Uploaded", data: { _id: "file-1", name: "photo.png" } });
    const { result } = renderHook(() => useFileUpload({ retainFailures: true }));
    await act(() => result.current.handleUpload({ id: "selection-1", file: new File(["image"], "photo.png"), progress: 0 }));
    expect(result.current.files).toHaveLength(1);
    expect(result.current.files[0].uploadFailed).toBe(true);
    await act(() => result.current.retryUpload(result.current.files[0]));
    expect(result.current.files).toHaveLength(1);
    expect(result.current.files[0].uploadedFile?._id).toBe("file-1");
    expect(result.current.files[0].uploadFailed).toBe(false);
  });
  it("ignores a delayed FileReader callback after the owning screen unmounts", async () => {
    vi.mocked(fileUploadFetcher).mockResolvedValue({
      success: true,
      message: "uploaded",
      data: { _id: "file-1" },
    });
    const { result, unmount } = renderHook(useFileUpload);
    const delayedUpload = result.current.handleUpload;
    unmount();
    await delayedUpload({
      id: "selection-1",
      file: new File(["image"], "image.png"),
      progress: 0,
    });
    expect(fileUploadFetcher).not.toHaveBeenCalled();
  });

  it("still uploads and displays a file while its screen is mounted", async () => {
    const uploadedFile = {
      _id: "file-1",
      name: "image.png",
      type: "image/png",
      url: "blob:local-file",
      size: 5,
    };
    vi.mocked(fileUploadFetcher).mockResolvedValue({
      success: true,
      message: "uploaded",
      data: uploadedFile,
    });
    const { result } = renderHook(useFileUpload);
    await act(() =>
      result.current.handleUpload({
        id: "selection-1",
        file: new File(["image"], "image.png"),
        progress: 0,
      }),
    );
    expect(result.current.files).toEqual([
      expect.objectContaining({ uploadedFile, progress: 100 }),
    ]);
  });

  it("ignores stale file deletion callbacks after a mode change", async () => {
    const { result, unmount } = renderHook(useFileUpload);
    const delayedDelete = result.current.handleDeleteFile;
    unmount();
    await delayedDelete({
      id: "selection-1",
      file: null,
      progress: 100,
      uploadedFile: {
        _id: "file-1",
        name: "image.png",
        type: "image/png",
        url: "blob:local-file",
        size: 5,
      },
    });
    expect(deleteFetcher).not.toHaveBeenCalled();
  });
});
