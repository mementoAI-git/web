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
  it.each(["", "   "])("hides empty assistant placeholders (%j) until reply text arrives", (text) => {
    const { container, rerender } = render(<Bubble role="ai" text={text} />);
    expect(container).toBeEmptyDOMElement();
    rerender(<Bubble role="ai" text="A reply" />);
    expect(screen.getByText("A reply")).toBeVisible();
  });

  it("keeps voice-only assistant messages", () => {
    const { container } = render(<Bubble role="ai" text="" is_voice duration={12} />);
    expect(container).not.toBeEmptyDOMElement();
  });

  it.each([false, true])("gives assistant replies a themeable panel including topic=%s", (topic) => {
    const { rerender } = render(<Bubble role="ai" text="Assistant reply" topic={topic} />);
    expect(screen.getByText("Assistant reply").closest(".chat-reply-surface")).toBeInTheDocument();
    expect(screen.getByText("Assistant reply").closest("span")).toHaveClass("text-text-neutral-strong");
    rerender(<Bubble role="user" text="User message" topic={topic} />);
    expect(screen.getByText("User message").closest(".chat-reply-surface")).toBeNull();
  });

  describe("sent images", () => {
    const image = (id: number) => ({ _id: `f${id}`, name: `${id}.jpg`, type: "image/jpeg", url: `/${id}.jpg` });
    const surface = (container: HTMLElement) => container.querySelector(".sky-card");

    it("drops the bubble when a message is only 1-3 images", () => {
      const { container } = render(<Bubble role="user" text="" attatchments={[image(1), image(2)]} />);
      expect(screen.getByTestId("chat-media-group").querySelector('[data-layout="stack"]')).toBeInTheDocument();
      expect(surface(container)).toBeNull();
    });

    it("keeps the caption in its own bubble below the stack", () => {
      const { container } = render(<Bubble role="user" text="Look at these" attatchments={[image(1)]} />);
      expect(surface(container)).toContainElement(screen.getByText("Look at these"));
      expect(surface(container)).not.toContainElement(screen.getByTestId("chat-media-group"));
    });

    it("keeps four images in the grid inside the bubble", () => {
      const { container } = render(<Bubble role="user" text="" attatchments={[1, 2, 3, 4].map(image)} />);
      expect(surface(container)).toContainElement(screen.getByTestId("chat-media-group"));
      expect(screen.getByTestId("chat-media-group").querySelector('[data-layout="grid"]')).toBeInTheDocument();
    });
  });

  it("uses fill neutral weak for AI messages", () => {
    render(<Bubble role="ai" text="Hello from the assistant" />);

    const bubble = screen
      .getByText("Hello from the assistant")
      .closest(".bg-fill-neutral-weak");
    expect(bubble).toBeInTheDocument();
  });

  it("hides the model name from AI replies", () => {
    render(
      <Bubble
        role="ai"
        text="Hello from the assistant"
        modelLabel="gemini:gemini-2.5-flash"
      />,
    );

    expect(
      screen.queryByText("gemini:gemini-2.5-flash"),
    ).not.toBeInTheDocument();
  });

  it("caps AI reply width at 75%", () => {
    render(<Bubble role="ai" text="Assistant reply" />);

    const body = screen
      .getByText("Assistant reply")
      .closest("div.rounded-\\[16px\\]");
    expect(body?.parentElement).toHaveClass("w-fit", "max-w-[75%]");
  });

  it("keeps AI replies left-aligned", () => {
    const { container } = render(<Bubble role="ai" text="Assistant reply" />);

    expect(container.firstElementChild).not.toHaveClass("items-end");
  });

  it("uses the warm translucent fill for user messages", () => {
    render(<Bubble role="user" text="User said this" />);

    const bubble = screen
      .getByText("User said this")
      .closest(".bg-fill-chat-user");
    expect(bubble).toBeInTheDocument();
  });

  it("keeps chat body text at 16px on desktop and compact text in the sidebar", () => {
    const { rerender } = render(<Bubble role="ai" text="Full thread" />);
    const full = screen.getByText("Full thread").closest("span");
    expect(full?.className).toMatch(/text-base/);
    expect(full).not.toHaveClass("sm:text-xl");
    expect(screen.getByText("Full thread")).toHaveClass("text-base");
    expect(screen.getByText("Full thread")).not.toHaveClass("sm:text-xl");

    rerender(<Bubble role="ai" text="Sidebar" compact />);
    const compact = screen.getByText("Sidebar").closest("span");
    expect(compact?.className).toMatch(/text-\[14px\]/);
    expect(compact?.className).not.toMatch(/md:text-xl/);
  });

  it("caps user message body width at min(380px, 85%)", () => {
    render(<Bubble role="user" text="User said this" />);
    const body = screen
      .getByText("User said this")
      .closest("div.rounded-\\[16px\\]");
    expect(body?.parentElement).toHaveClass("max-w-[min(380px,85%)]");
    expect(body).not.toHaveClass("max-w-[min(380px,85%)]");
  });

  it("aligns the user bubble and Reply row to the same right edge", () => {
    const { container } = render(
      <Bubble
        role="user"
        text="User said this"
        createdAt="2026-09-24T20:40:00.000Z"
        onReply={vi.fn()}
      />,
    );

    const body = screen
      .getByText("User said this")
      .closest("div.rounded-\\[16px\\]");
    const wrapper = body?.parentElement;
    const meta = screen.getByRole("button", { name: /reply to message/i })
      .parentElement;

    expect(container.firstElementChild).toHaveClass("items-end");
    expect(wrapper).toHaveClass("flex", "flex-col", "items-end");
    expect(body).toHaveClass("w-fit", "max-w-full");
    expect(meta).toHaveClass("w-fit", "max-w-full", "justify-end");
  });

  it("uses a 16px radius with 12px horizontal and 8px vertical padding", () => {
    render(<Bubble role="user" text="Hi" />);
    const body = screen.getByText("Hi").closest("div.rounded-\\[16px\\]");
    expect(body).toBeInTheDocument();
    expect(body).toHaveClass("px-3", "py-2");
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
