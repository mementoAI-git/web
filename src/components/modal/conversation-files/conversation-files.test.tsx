import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ConversationFiles from ".";

const close = vi.fn();
const push = vi.fn();
const fetcherMock = vi.fn();
const modalState: { name: string }[] = [];

vi.mock("focus-trap-react", () => ({ default: ({ children }: { children: React.ReactNode }) => children }));
vi.mock("@/hooks/use-modal", () => ({ useModal: () => ({ close, push, state: modalState }) }));
vi.mock("@/api/fetcher", () => ({ fetcher: (...args: unknown[]) => fetcherMock(...args) }));
vi.mock("@/features/media/signed-media-access", () => ({ useSignedMediaAccess: (file: { url: string }) => ({ src: file.url, onError: vi.fn() }) }));

const image = { _id: "f1", name: "family.jpg", type: "image/jpeg", url: "/family.jpg", size: 10 };
const doc = { _id: "d1", name: "notes.pdf", type: "application/pdf", url: "/notes.pdf", size: 20 };
const messages = [{ _id: "m1", text: "https://example.com", role: "user", user: "u1", created_at: "2026-07-13T13:34:00.000Z", attatchments: [image, doc] }];

describe("conversation files", () => {
  beforeEach(() => {
    close.mockClear();
    push.mockClear();
    modalState.length = 0;
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
    expect(screen.getByRole("dialog", { name: "Shared files" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "family.jpg" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("tab", { name: /docs/i }));
    expect(screen.getByText("notes.pdf")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: /search conversation files/i }), { target: { value: "missing" } });
    expect(screen.getByText(/no results for “missing”/i)).toBeInTheDocument();
    await waitFor(() => expect(fetcherMock).toHaveBeenCalled());
  });

  it("shows saved API attachments from older chat history", async () => {
    fetcherMock.mockResolvedValueOnce({ success: true, data: {
      messages: [{ ...messages[0], attatchments: undefined, attachments: [image, doc] }], next: null,
    } });
    render(<ConversationFiles data={{ conversationId: "conversation-1", messages: [] }} />);
    expect(await screen.findByRole("img", { name: "family.jpg" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("tab", { name: /docs/i }));
    expect(screen.getByText("notes.pdf")).toBeInTheDocument();
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

  it("shows a loading state followed by a helpful empty state", async () => {
    let finish!: (value: unknown) => void;
    fetcherMock.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    render(<ConversationFiles data={{ conversationId: "conversation-1", messages: [] }} />);
    expect(screen.getByRole("status", { name: "Loading shared files" })).toBeInTheDocument();
    expect(screen.queryByText("No media yet")).not.toBeInTheDocument();
    finish({ success: true, data: { messages: [], next: null } });
    expect(await screen.findByText("No media yet")).toBeInTheDocument();
    expect(screen.getByText(/you share in this conversation will appear here/)).toBeInTheDocument();
  });

  it("clears an empty search and restores results and input focus", async () => {
    const user = userEvent.setup();
    render(<ConversationFiles data={{ conversationId: "conversation-1", messages }} />);
    const search = screen.getByRole("textbox", { name: "Search conversation files" });
    await user.type(search, "not-found");
    expect(await screen.findByText("No matching files")).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Clear search" })[0]);
    expect(search).toHaveValue("");
    expect(search).toHaveFocus();
    expect(screen.getByRole("img", { name: "family.jpg" })).toBeInTheDocument();
  });

  it("dismisses through the shared dialog close button and Escape", async () => {
    const user = userEvent.setup();
    render(<ConversationFiles data={{ conversationId: "conversation-1", messages: [] }} />);
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(close).toHaveBeenCalledWith("conversation-files");
    close.mockClear();
    await user.keyboard("{Escape}");
    expect(close).toHaveBeenCalledWith("conversation-files");
  });

  it("releases the dialog for a file preview and retains the search when returning", async () => {
    const user = userEvent.setup();
    const data = { conversationId: "conversation-1", messages };
    const { rerender } = render(<ConversationFiles data={data} />);
    await user.type(screen.getByRole("textbox"), "family");
    modalState.push({ name: "file-preview" }, { name: "conversation-files" });
    rerender(<ConversationFiles data={data} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(document.body.style.pointerEvents).not.toBe("none"));
    modalState.shift();
    rerender(<ConversationFiles data={data} />);
    expect(screen.getByRole("textbox")).toHaveValue("family");
    expect(screen.getByRole("img", { name: "family.jpg" })).toBeInTheDocument();
    expect(fetcherMock).toHaveBeenCalledOnce();
  });
});
