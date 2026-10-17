import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import DocumentPreview from "./document";

const refresh = vi.hoisted(() => vi.fn());
vi.mock("@/features/media/signed-media-access", () => ({ useSignedMediaAccess: (file: { url: string }) => ({ src: file.url, onError: refresh }) }));
const file = { _id: "text-1", name: "notes.txt", type: "", url: "/notes.txt", size: 10, onDelete: vi.fn() };
afterEach(() => { vi.restoreAllMocks(); refresh.mockReset(); });

describe("document preview", () => {
  it("detects text by extension and preserves content without executing markup", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("Hello\n<script>alert('x')</script>"));
    const { container } = render(<DocumentPreview {...file} />);
    expect(await screen.findByText(/Hello/)).toBeInTheDocument();
    expect(container.querySelector("pre")!.textContent).toBe("Hello\n<script>alert('x')</script>");
    expect(container.querySelector("script")).toBeNull();
  });

  it("supports empty text files", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(""));
    render(<DocumentPreview {...file} />);
    expect(await screen.findByText("This text file is empty.")).toBeInTheDocument();
  });

  it("offers a retry after failed requests", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(null, { status: 500 })).mockResolvedValueOnce(new Response("Recovered document"));
    render(<DocumentPreview {...file} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to load");
    await userEvent.click(screen.getByRole("button", { name: "Retry preview" }));
    expect(await screen.findByText("Recovered document")).toBeInTheDocument();
  });

  it("attempts signed access renewal after an expired link", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 403 }));
    render(<DocumentPreview {...file} />);
    await screen.findByRole("alert");
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("aborts stale requests when switching files and ignores their late results", async () => {
    let finish!: (response: Response) => void;
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementationOnce(() => new Promise<Response>((resolve) => { finish = resolve; })).mockResolvedValueOnce(new Response("Latest file"));
    const { rerender } = render(<DocumentPreview {...file} />);
    const signal = fetchMock.mock.calls[0][1]!.signal!;
    rerender(<DocumentPreview {...file} url="/latest.txt" />);
    expect(signal.aborted).toBe(true);
    await screen.findByText("Latest file");
    finish(new Response("Stale file"));
    await waitFor(() => expect(screen.queryByText("Stale file")).not.toBeInTheDocument());
  });
});
