import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PdfPreview from "./pdf";

const mocks = vi.hoisted(() => ({ getDocument: vi.fn(), destroy: vi.fn(), getPage: vi.fn(), renderPage: vi.fn(), cancel: vi.fn() }));
vi.mock("pdfjs-dist", () => ({ getDocument: mocks.getDocument, GlobalWorkerOptions: {} }));

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({} as CanvasRenderingContext2D);
  mocks.destroy.mockResolvedValue(undefined);
  mocks.renderPage.mockReturnValue({ promise: Promise.resolve(), cancel: mocks.cancel });
  mocks.getPage.mockResolvedValue({ getViewport: ({ scale }: { scale: number }) => ({ width: 500 * scale, height: 700 * scale }), render: mocks.renderPage, getTextContent: async () => ({ items: [{ str: "Readable PDF content" }] }) });
  mocks.getDocument.mockReturnValue({ promise: Promise.resolve({ numPages: 2, getPage: mocks.getPage }), destroy: mocks.destroy });
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.clearAllMocks(); });

describe("PDF preview", () => {
  it("navigates PDF pages with arrow keys and clamps at the boundaries", async () => {
    render(<PdfPreview data={new ArrayBuffer(10)} onRetry={vi.fn()} />);
    await screen.findByRole("img", { name: "PDF page 1" });
    fireEvent.keyDown(window, { key: "ArrowRight" });
    await screen.findByRole("img", { name: "PDF page 2" });
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole("combobox", { name: "Zoom" }), { key: "ArrowLeft" });
    expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
    fireEvent.keyDown(screen.getByLabelText("PDF document pages"), { key: "ArrowLeft" });
    await screen.findByRole("img", { name: "PDF page 1" });
  });
  it("renders PDF pages, exposes page text, and supports pagination", async () => {
    render(<PdfPreview data={new ArrayBuffer(10)} onRetry={vi.fn()} />);
    expect(await screen.findByRole("img", { name: "PDF page 1" })).toBeVisible();
    expect(screen.getByText("Readable PDF content")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous PDF page" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Next PDF page" }));
    expect(await screen.findByRole("img", { name: "PDF page 2" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Next PDF page" })).toBeDisabled();
    expect(mocks.getPage).toHaveBeenCalledWith(2);
  });

  it("renders zoomed pages and releases the worker on close", async () => {
    const { unmount } = render(<PdfPreview data={new ArrayBuffer(10)} onRetry={vi.fn()} />);
    await screen.findByRole("img", { name: "PDF page 1" });
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Zoom" }), "2");
    await waitFor(() => expect(mocks.renderPage.mock.calls.at(-1)![0].viewport.width).toBe(200));
    unmount();
    expect(mocks.destroy).toHaveBeenCalled();
  });

  it("shows an actionable error for invalid PDFs", async () => {
    mocks.getDocument.mockReturnValue({ promise: Promise.reject(new Error("Invalid PDF")), destroy: mocks.destroy });
    const retry = vi.fn();
    render(<PdfPreview data={new ArrayBuffer(10)} onRetry={retry} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to preview this PDF");
    await userEvent.click(screen.getByRole("button", { name: "Retry preview" }));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
