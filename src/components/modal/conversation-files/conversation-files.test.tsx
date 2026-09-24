import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ConversationFiles from ".";

const close = vi.fn();
const push = vi.fn();
const fetcherMock = vi.fn();

vi.mock("focus-trap-react", () => ({ default: ({ children }: { children: React.ReactNode }) => children }));
vi.mock("@/hooks/use-modal", () => ({ useModal: () => ({ close, push }) }));
vi.mock("@/api/fetcher", () => ({ fetcher: (...args: unknown[]) => fetcherMock(...args) }));
vi.mock("@/features/media/signed-media-access", () => ({ useSignedMediaAccess: (file: { url: string }) => ({ src: file.url, onError: vi.fn() }) }));

const image = { _id: "f1", name: "family.jpg", type: "image/jpeg", url: "/family.jpg", size: 10 };
const doc = { _id: "d1", name: "notes.pdf", type: "application/pdf", url: "/notes.pdf", size: 20 };
const messages = [{ _id: "m1", text: "https://example.com", role: "user", user: "u1", created_at: "2026-07-13T13:34:00.000Z", attatchments: [image, doc] }];

describe("conversation files", () => {
  beforeEach(() => {
    close.mockClear();
    push.mockClear();
    fetcherMock.mockReset();
    fetcherMock.mockResolvedValue({ success: true, data: { messages: [], next: null } });
  });

  it("loads every conversation history page and never requests the global files endpoint", async () => {
    fetcherMock
      .mockResolvedValueOnce({ success: true, data: { messages: [{ _id: "a" }], next: "cursor-2" } })
      .mockResolvedValueOnce({ success: true, data: { messages: [{ _id: "b" }], next: null } });
    render(<ConversationFiles data={{ conversationId: "conversation-1", messages: [] }} />);
    await waitFor(() => expect(fetcherMock).toHaveBeenCalledTimes(2));
    expect(fetcherMock.mock.calls.map(([url]) => String(url))).toEqual([
      expect.stringContaining("/conversation-1?next="),
      expect.stringContaining("/conversation-1?next=cursor-2"),
    ]);
    expect(fetcherMock.mock.calls.some(([url]) => String(url) === "/files")).toBe(false);
  });

  it("shows only supplied conversation assets and filters tabs and search", async () => {
    render(<ConversationFiles data={{ conversationId: "conversation-1", messages }} />);
    expect(screen.getByRole("heading", { name: "All files (3)" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "family.jpg" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("tab", { name: /docs/i }));
    expect(screen.getByText("notes.pdf")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: /search conversation files/i }), { target: { value: "missing" } });
    expect(screen.getByText(/no results for “missing”/i)).toBeInTheDocument();
    await waitFor(() => expect(fetcherMock).toHaveBeenCalled());
  });

  it("opens the selected conversation image at its exact index", async () => {
    const second = { ...image, _id: "f2", name: "second.jpg", url: "/second.jpg" };
    render(<ConversationFiles data={{ conversationId: "conversation-1", messages: [{ ...messages[0], attatchments: [image, second] }] }} />);
    await userEvent.click(screen.getByRole("button", { name: /open second.jpg in viewer/i }));
    expect(push).toHaveBeenCalledWith("file-preview", {
      files: [
        { ...image, sharedAt: "2026-07-13T13:34:00.000Z" },
        { ...second, sharedAt: "2026-07-13T13:34:00.000Z" },
      ],
      startIndex: 1,
    });
  });

  it("keeps loaded results and offers retry when older history fails", async () => {
    fetcherMock.mockRejectedValueOnce(new Error("offline"));
    render(<ConversationFiles data={{ conversationId: "conversation-1", messages }} />);
    expect(await screen.findByText(/some older files couldn.t be loaded/i)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "family.jpg" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(fetcherMock).toHaveBeenCalledTimes(2));
  });
});
