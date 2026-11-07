import { useEffect } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { ModalProvider, useModal } from "@/hooks/use-modal";
import type { IMemory } from "@/utility/interface";
import Modal from "..";
import ShareMemory from "./share-memory";

const { storyMounted } = vi.hoisted(() => ({ storyMounted: vi.fn() }));

// The modal index reaches pdfjs through the composer, and pdfjs needs DOMMatrix, which jsdom lacks.
vi.mock("pdfjs-dist", () => ({ getDocument: vi.fn(), GlobalWorkerOptions: {}, version: "test" }));

vi.mock("./view", () => ({
  ViewMemory: () => {
    useEffect(() => {
      storyMounted();
    }, []);
    return <div>Open story</div>;
  },
}));

const story = { _id: "story-1", title: "A story", type: "story" } as unknown as IMemory;

let modal: ReturnType<typeof useModal>;
function ModalHarness() {
  modal = useModal();
  return <Modal />;
}

beforeEach(() => vi.clearAllMocks());

it("uses the shared layout and copies the story link", async () => {
  const user = userEvent.setup();
  render(<ShareMemory data={{ memory: story }} />);
  const link = `${window.location.origin}/post/story-1`;
  expect(screen.getByRole("dialog", { name: "Share this Story" })).toBeInTheDocument();
  expect(screen.getByLabelText("Share link")).toHaveValue(link);
  expect(screen.getByRole("button", { name: "Share on LinkedIn" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Copy link" }));
  expect(await navigator.clipboard.readText()).toBe(link);
  expect(await screen.findByRole("button", { name: "Copied" })).toBeInTheDocument();
});

it("copies the link from the button beside it", async () => {
  const user = userEvent.setup();
  render(<ShareMemory data={{ memory: story }} />);
  await user.click(screen.getByRole("button", { name: "Copy share link" }));
  expect(await navigator.clipboard.readText()).toBe(`${window.location.origin}/post/story-1`);
  expect(await screen.findByRole("button", { name: "Link copied" })).toHaveTextContent("Copied");
});

it("links conversations to chat", () => {
  render(<ShareMemory data={{ memory: { ...story, type: "conversation" } as IMemory }} />);
  expect(screen.getByRole("dialog", { name: "Share this conversation" })).toBeInTheDocument();
  expect(screen.getByLabelText("Share link")).toHaveValue(`${window.location.origin}/chat/story-1`);
});

it("closes from Dismiss and keeps the story mounted beneath it", async () => {
  render(<ModalProvider><ModalHarness /></ModalProvider>);
  act(() => modal.open?.("view-memory", { _id: "story-1" }));
  expect(await screen.findByText("Open story")).toBeInTheDocument();
  act(() => modal.push?.("share-memory", { memory: story }));
  expect(await screen.findByRole("dialog", { name: "Share this Story" })).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));
  await waitFor(() => expect(screen.queryByRole("dialog", { name: "Share this Story" })).not.toBeInTheDocument());
  expect(screen.getByText("Open story")).toBeInTheDocument();
  expect(storyMounted).toHaveBeenCalledTimes(1);
});

it("leaves the story open when a dialog above already handled Escape", async () => {
  render(<ModalProvider><ModalHarness /></ModalProvider>);
  act(() => modal.open?.("view-memory", { _id: "story-1" }));
  await screen.findByText("Open story");
  const handled = new KeyboardEvent("keydown", { key: "Escape", cancelable: true });
  handled.preventDefault();
  act(() => { window.dispatchEvent(handled); });
  expect(modal.state.map((entry) => entry.name)).toEqual(["view-memory"]);
  act(() => { window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", cancelable: true })); });
  expect(modal.state).toEqual([]);
});

it("closes once on Escape, leaving the story open", async () => {
  render(<ModalProvider><ModalHarness /></ModalProvider>);
  act(() => modal.open?.("view-memory", { _id: "story-1" }));
  act(() => modal.push?.("share-memory", { memory: story }));
  await screen.findByRole("dialog", { name: "Share this Story" });
  await userEvent.keyboard("{Escape}");
  await waitFor(() => expect(modal.state.map((entry) => entry.name)).toEqual(["view-memory"]));
});
