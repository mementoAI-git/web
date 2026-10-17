import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import UploadFiles from "./index";
import { storageKeys } from "@/utility/constant";

const mocks = vi.hoisted(() => ({ upload: vi.fn(), attach: vi.fn(), close: vi.fn(), remove: vi.fn(), error: vi.fn(), success: vi.fn() }));
vi.mock("@/hooks/use-fetcher", () => ({ default: () => ({ trigger: mocks.attach, isMutating: false }), useFileUploadFetcher: () => ({ trigger: mocks.upload }) }));
vi.mock("@/hooks/use-modal", () => ({ useModal: () => ({ close: mocks.close }) }));
vi.mock("@/api/fetcher", () => ({ deleteFetcher: mocks.remove }));
vi.mock("sonner", () => ({ toast: { error: mocks.error, success: mocks.success } }));

function chooseFile() {
  fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [new File(["image"], "photo.png", { type: "image/png" })] } });
}
function deferred() {
  let resolve!: (value: unknown) => void;
  const promise = new Promise((r) => { resolve = r; });
  return { promise, resolve };
}
const confirmed = { success: true, data: { _id: "server-file", name: "photo.png", size: 5 } };

describe("UploadFiles submission", () => {
  beforeEach(() => { vi.clearAllMocks(); vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} }); localStorage.clear(); mocks.attach.mockResolvedValue({ success: true }); mocks.remove.mockResolvedValue({ success: true }); });

  it("blocks attaching a processing file until its server ID arrives", async () => {
    const request = deferred();
    mocks.upload.mockImplementation((payload) => { payload.onProgress(80); return request.promise; });
    render(<UploadFiles data="story-1" />);
    chooseFile();
    expect(screen.getByRole("button", { name: "Add to post" })).toBeDisabled();
    expect(screen.getByText("Processing")).toBeInTheDocument();
    await act(async () => request.resolve(confirmed));
    expect(screen.getByText("Ready")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add to post" }));
    await waitFor(() => expect(mocks.attach).toHaveBeenCalledWith({ attachments: ["server-file"] }));
    expect(mocks.close).toHaveBeenCalledWith("file-upload");
  });

  it("retains failed files for retry and never attaches them", async () => {
    mocks.upload.mockResolvedValueOnce({ success: false, data: null }).mockResolvedValueOnce(confirmed);
    render(<UploadFiles />);
    chooseFile();
    const retry = await screen.findByRole("button", { name: "Retry photo.png" });
    expect(screen.getByRole("button", { name: "Add to post" })).toBeDisabled();
    fireEvent.click(retry);
    await screen.findByText("Ready");
    fireEvent.click(screen.getByRole("button", { name: "Add to post" }));
    await waitFor(() => expect(mocks.close).toHaveBeenCalled());
    const saved = JSON.parse(localStorage.getItem(storageKeys.attachments)!);
    expect(saved.files[0].result._id).toBe("server-file");
  });

  it("keeps confirmed files and the dialog open when attachment saving fails", async () => {
    mocks.upload.mockResolvedValue(confirmed);
    mocks.attach.mockResolvedValue({ success: false, message: "Not saved" });
    render(<UploadFiles data="story-1" />);
    chooseFile();
    await screen.findByText("Ready");
    fireEvent.click(screen.getByRole("button", { name: "Add to post" }));
    await waitFor(() => expect(mocks.attach).toHaveBeenCalled());
    expect(mocks.close).not.toHaveBeenCalled();
    expect(screen.getByText("Ready")).toBeInTheDocument();
  });

  it("recovers rejected upload requests with a retry action", async () => {
    mocks.upload.mockRejectedValue(new Error("Offline"));
    render(<UploadFiles />);
    chooseFile();
    expect(await screen.findByRole("button", { name: "Retry photo.png" })).toBeInTheDocument();
    expect(mocks.error).toHaveBeenCalled();
  });

  it("does not restore another draft's attachments into an existing story", () => {
    localStorage.setItem(storageKeys.attachments, JSON.stringify({ files: [{ id: "draft", progress: 100, result: { _id: "old-file" } }] }));
    render(<UploadFiles data="story-1" />);
    expect(screen.getByRole("button", { name: "Add to post" })).toBeDisabled();
    expect(screen.getByText("Nothing uploaded yet")).toBeInTheDocument();
  });

  it("does not resurrect a pending file after it is removed", async () => {
    const request = deferred();
    mocks.upload.mockReturnValue(request.promise);
    render(<UploadFiles />);
    chooseFile();
    fireEvent.click(screen.getByRole("button", { name: "Remove photo.png" }));
    await act(async () => request.resolve(confirmed));
    expect(screen.queryByText("Ready")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add to post" })).toBeDisabled();
  });

  it("ignores unfinished uploads in persisted draft metadata", () => {
    localStorage.setItem(storageKeys.attachments, JSON.stringify({ files: [{ id: "unfinished", progress: 100 }] }));
    render(<UploadFiles />);
    expect(screen.getByRole("button", { name: "Add to post" })).toBeDisabled();
    expect(screen.getByText("Nothing uploaded yet")).toBeInTheDocument();
  });
});
