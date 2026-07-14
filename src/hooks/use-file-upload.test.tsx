import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { IFile } from "@/utility/interface";
import useFileUpload from "./use-file-upload";

const { mockFileUploadFetcher, mockDeleteFetcher } = vi.hoisted(() => ({
  mockFileUploadFetcher: vi.fn(),
  mockDeleteFetcher: vi.fn(),
}));

vi.mock("@/api/fetcher", () => ({
  fileUploadFetcher: mockFileUploadFetcher,
  deleteFetcher: mockDeleteFetcher,
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function makeUploadedFile(name: string, id: string): IFile {
  return {
    _id: id,
    name,
    url: `https://cdn.test/${name}`,
    size: 128,
    type: "application/pdf",
  };
}

describe("useFileUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps earlier uploads when another upload starts before it finishes", async () => {
    const firstUpload = deferred<{ success: true; data: IFile }>();
    const secondUpload = deferred<{ success: true; data: IFile }>();

    mockFileUploadFetcher
      .mockImplementationOnce(async (_url: string, { arg }: { arg: { onProgress?: (progress: number) => void } }) => {
        arg.onProgress?.(20);
        return firstUpload.promise;
      })
      .mockImplementationOnce(async (_url: string, { arg }: { arg: { onProgress?: (progress: number) => void } }) => {
        arg.onProgress?.(35);
        return secondUpload.promise;
      });

    const { result } = renderHook(() => useFileUpload());

    const firstFile = new File(["first"], "first.pdf", { type: "application/pdf" });
    const secondFile = new File(["second"], "second.pdf", { type: "application/pdf" });

    await act(async () => {
      void result.current.handleUpload({ id: "one", file: firstFile, progress: 0 });
      void result.current.handleUpload({ id: "two", file: secondFile, progress: 0 });
    });

    await waitFor(() => {
      expect(result.current.files).toHaveLength(2);
      expect(result.current.files.map((file) => file.id)).toEqual(["one", "two"]);
      expect(result.current.files.map((file) => file.progress)).toEqual([20, 35]);
    });

    await act(async () => {
      secondUpload.resolve({ success: true, data: makeUploadedFile("second.pdf", "file-2") });
      firstUpload.resolve({ success: true, data: makeUploadedFile("first.pdf", "file-1") });
    });

    await waitFor(() => {
      expect(result.current.files).toHaveLength(2);
      expect(result.current.files.map((file) => file.uploadedFile?._id)).toEqual(["file-1", "file-2"]);
      expect(result.current.files.map((file) => file.progress)).toEqual([100, 100]);
    });
  });
});
