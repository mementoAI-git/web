import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import Bubble from "./bubble";

const API = "http://localhost:3000/api";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Bubble", () => {
  it("has no fill background on AI message body", () => {
    render(<Bubble role="ai" text="Hello from the assistant" />);

    expect(screen.getByText("Hello from the assistant")).toBeInTheDocument();
    const bubble = screen.getByText("Hello from the assistant").closest("div.w-full");
    expect(bubble).toBeInTheDocument();
    expect(bubble?.className.includes("bg-fill-neutral-weaker")).toBe(false);
  });

  it("uses fill neutral weaker for user messages", () => {
    render(<Bubble role="user" text="User said this" />);

    const bubble = screen.getByText("User said this").closest(".bg-fill-neutral-weaker");
    expect(bubble).toBeInTheDocument();
  });

  it("uses a calm readable 16px body size in the full chat", () => {
    const { rerender } = render(<Bubble role="ai" text="Full thread" />);
    const full = screen.getByText("Full thread").closest("span");
    expect(full?.className).toMatch(/text-base/);
    expect(full?.className).not.toMatch(/md:text-xl/);

    rerender(<Bubble role="ai" text="Sidebar" compact />);
    const compact = screen.getByText("Sidebar").closest("span");
    expect(compact?.className).toMatch(/text-\[14px\]/);
    expect(compact?.className).not.toMatch(/md:text-xl/);
  });

  it("caps user message body width at min(380px, 85%)", () => {
    render(<Bubble role="user" text="User said this" />);
    const body = screen.getByText("User said this").closest("div.rounded-\\[8px\\]");
    expect(body?.className).toContain("max-w-[min(380px,85%)]");
  });

  it("uses 8px padding and radius on message bodies", () => {
    render(<Bubble role="user" text="Hi" />);
    const body = screen.getByText("Hi").closest("div.rounded-\\[8px\\]");
    expect(body).toBeInTheDocument();
    expect(body?.className).toMatch(/\bp-2\b/);
  });

  it("uses horizontal gutter on sm+ for the bubble column", () => {
    const { container } = render(<Bubble role="ai" text="Assistant reply" />);
    const column = container.firstChild as HTMLElement;
    expect(column.className).toMatch(/\bpx-0\b/);
    expect(column.className).toMatch(/\bsm:px-1\b/);
  });

  it("renders created_at as a local time label", () => {
    render(
      <Bubble
        role="user"
        text="Hello"
        createdAt="2024-06-15T14:30:00.000Z"
      />,
    );
    expect(screen.getByRole("time")).toBeInTheDocument();
    expect(screen.getByRole("time")).toHaveAttribute(
      "datetime",
      "2024-06-15T14:30:00.000Z",
    );
  });

  it("copies message text when Copy is activated", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    render(<Bubble role="ai" text="Copy me" />);
    await user.click(screen.getByRole("button", { name: /copy message/i }));
    expect(writeText).toHaveBeenCalledWith("Copy me");

    vi.unstubAllGlobals();
  });

  it("shows retry when sendFailed and onRetry are set", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <Bubble role="user" text="oops" sendFailed onRetry={onRetry} />,
    );
    await user.click(screen.getByRole("button", { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("calls onReply when Reply is activated", async () => {
    const user = userEvent.setup();
    const onReply = vi.fn();
    render(<Bubble role="ai" text="Target" onReply={onReply} />);
    await user.click(screen.getByRole("button", { name: /reply to message/i }));
    expect(onReply).toHaveBeenCalledTimes(1);
  });

  it("shows inline quote on user bubble when replyQuote is set", () => {
    render(
      <Bubble
        role="user"
        text="My answer"
        replyQuote={{ role: "ai", text: "Original assistant line" }}
      />,
    );
    expect(screen.getByText(/replying to memento/i)).toBeInTheDocument();
    expect(screen.getByText("My answer")).toBeInTheDocument();
  });

  it("shows Reply for image-only messages when onReply is set", () => {
    const onReply = vi.fn();
    render(
      <Bubble
        role="user"
        text=""
        attatchments={[{ url: "https://example.com/x.png", name: "x.png" }]}
        onReply={onReply}
      />,
    );
    expect(screen.getByRole("button", { name: /reply to message/i })).toBeInTheDocument();
  });

  it("refreshes a failed signed chat image", async () => {
    server.use(
      http.post(`${API}/files/file-1/access`, () =>
        HttpResponse.json({
          status: 200,
          success: true,
          message: "File access refreshed successfully",
          data: {
            _id: "file-1",
            url: "/files/photo.jpg?cap=new",
            name: "photo.jpg",
            type: "image/jpeg",
            size: 100,
            access: {
              expires_at: "2099-01-01T00:00:00.000Z",
              refresh_endpoint: "/files/file-1/access",
            },
          },
          meta: { contract_version: "2026-08", request_id: "request-1" },
        }),
      ),
    );

    render(
      <Bubble
        role="user"
        text=""
        attatchments={[
          {
            _id: "file-1",
            url: "/files/photo.jpg?cap=old",
            name: "photo.jpg",
            type: "image/jpeg",
            size: 100,
            access: {
              expires_at: "2099-01-01T00:00:00.000Z",
              refresh_endpoint: "/files/file-1/access",
            },
          },
        ]}
      />,
    );

    const image = screen.getByRole("img", { name: "photo.jpg" });
    fireEvent.error(image);

    await waitFor(() =>
      expect(image).toHaveAttribute("src", "/files/photo.jpg?cap=new"),
    );
  });

  it("renders a URL-only message as one metadata preview when metadata exists", () => {
    render(
      <Bubble
        role="user"
        text="https://mymemento.io"
        linkMetadata={[{ url: "https://mymemento.io", title: "Mymemento.io", domain: "mymemento.io" }]}
      />,
    );
    expect(screen.getByText("Mymemento.io")).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("renders metadata-free URLs as normal links", () => {
    render(<Bubble role="user" text="Visit https://example.com for details" />);
    expect(screen.getByRole("link", { name: "https://example.com" })).toHaveClass("underline");
  });
});
