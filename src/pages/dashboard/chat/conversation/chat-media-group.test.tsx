import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChatMediaGroup } from "./chat-media-group";

const push = vi.fn();
vi.mock("@/hooks/use-modal", () => ({ useModal: () => ({ push }) }));

describe("ChatMediaGroup", () => {
  beforeEach(() => push.mockClear());

  it("uses the prominent single-image layout", () => {
    render(<ChatMediaGroup attachments={[{ _id: "f1", name: "one.jpg", type: "image/jpeg", url: "/one.jpg", size: 1 }]} />);
    expect(screen.getByTestId("chat-media-group").querySelector('[data-layout="single"]')).toBeInTheDocument();
  });

  it("uses one row for three visual items", () => {
    const files = Array.from({ length: 3 }, (_, index) => ({ _id: `f${index}`, name: `${index}.jpg`, type: "image/jpeg", url: `/${index}.jpg`, size: 1 }));
    render(<ChatMediaGroup attachments={files} />);
    expect(screen.getByTestId("chat-media-group").querySelector('[data-layout="row"]')).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /in viewer/i })).toHaveLength(3);
  });

  it("shows four tiles and the remaining count, then opens the exact item", async () => {
    const files = Array.from({ length: 6 }, (_, index) => ({ _id: `f${index}`, name: `${index}.jpg`, type: "image/jpeg", url: `/${index}.jpg`, size: 1 }));
    render(<ChatMediaGroup attachments={files} sharedAt="2026-07-13T13:34:00.000Z" />);
    expect(screen.getAllByRole("button", { name: /in viewer/i })).toHaveLength(4);
    expect(screen.getByText("+2")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /open 2.jpg in viewer/i }));
    expect(push).toHaveBeenCalledWith("file-preview", {
      files: files.map((file) => ({ ...file, sharedAt: "2026-07-13T13:34:00.000Z" })),
      startIndex: 2,
    });
  });

  it("renders audio and documents as compact rows", () => {
    render(<ChatMediaGroup attachments={[
      { _id: "a1", name: "voice.m4a", type: "audio/mp4", url: "/voice.m4a", size: 1 },
      { _id: "d1", name: "notes.pdf", type: "application/pdf", url: "/notes.pdf", size: 1 },
    ]} />);
    expect(screen.getByText("Audio")).toBeInTheDocument();
    expect(screen.getByText("application/pdf")).toBeInTheDocument();
  });
});
