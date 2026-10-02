import { act, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { CreateMemory } from "./index";
import Modal from "@/components/modal";
import { useModal } from "@/hooks/use-modal";
import { renderWithProviders } from "@/test";
import { server } from "@/test/mocks/server";
import { http, HttpResponse } from "msw";
import type { IOnUploadPayload } from "@/utility/interface";
import albumArtwork from "@/assets/image/HD Album story bg memento.png";
import darkAlbumArtwork from "@/assets/image/HD Album story bg memento dark.png";
import privateIcon from "@/assets/icon/mingcute_lock-fill.svg";
import everyoneIcon from "@/assets/icon/heroicons_users-16-solid.svg";
import calendarIcon from "@/assets/icon/uim_calendar.svg";

const { editorFocusMock } = vi.hoisted(() => ({
  editorFocusMock: vi.fn(),
}));
const { editorSetContentMock } = vi.hoisted(() => ({
  editorSetContentMock: vi.fn(),
}));
const { editorGetHTMLMock, editorGetTextMock, uploadState } = vi.hoisted(() => ({
  editorGetHTMLMock: vi.fn(() => ""),
  editorGetTextMock: vi.fn(() => ""),
  uploadState: { files: null as IOnUploadPayload[] | null },
}));
const { editorIsActiveMock, editorCommandMocks } = vi.hoisted(() => ({
  editorIsActiveMock: vi.fn(() => false),
  editorCommandMocks: {
    focus: vi.fn(),
    toggleBold: vi.fn(),
    toggleItalic: vi.fn(),
    toggleStrike: vi.fn(),
    toggleUnderline: vi.fn(),
    toggleBulletList: vi.fn(),
  },
}));

vi.mock("@/hooks/use-file-upload", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/hooks/use-file-upload")>();
  return {
    default: () => {
      const upload = original.default();
      return { ...upload, files: uploadState.files ?? upload.files };
    },
  };
});

const aiTaskRunMock = vi.fn();

vi.mock("@/features/ai/use-ai-task", async () => {
  const React = await import("react");

  return {
    useAiTask: (definition: { task: string }) => {
      const [result, setResult] = React.useState<unknown>(null);
      const [status, setStatus] = React.useState<"idle" | "completed">("idle");

      const run = async (
        input: unknown,
        runOptions?: { onError?: (error: { message: string; status?: number }) => void },
      ) => {
        aiTaskRunMock(definition.task, input);

        if (definition.task === "assistant.select_subagent") {
          const prompt = (input as { prompt?: string } | undefined)?.prompt?.toLowerCase() ?? "";
          const routeResult = prompt.includes("archive") || prompt.includes("enrich")
            ? {
                subagent: "media_archive",
                confidence: "high",
                reason: "The prompt is asking for archive enrichment.",
                suggested_task: "archive.enrich_memory",
              }
            : prompt.includes("title")
              ? {
                  subagent: "metadata",
                  confidence: "high",
                  reason: "The prompt is asking for a stronger title for the memory.",
                  suggested_task: "story.suggest_title",
                }
            : prompt.includes("expand")
              ? {
                  subagent: "writing",
                  confidence: "high",
                  reason: "The prompt is asking to expand the draft.",
                  suggested_task: "story.expand_draft",
                }
              : prompt.includes("rewrite") || prompt.includes("storyteller") || prompt.includes("story")
                ? {
                    subagent: "writing",
                    confidence: "high",
                    reason: "The prompt asks for writing help on a draft or story.",
                    suggested_task: "story.rewrite_draft",
                  }
                : prompt.includes("missing") || prompt.includes("details") || prompt.includes("sensory")
                  ? {
                      subagent: "memory_digging",
                      confidence: "high",
                      reason: "The prompt is trying to uncover more meaning or missing context.",
                      suggested_task: "story.identify_missing_details",
                    }
                  : prompt.includes("past memory") || prompt.includes("related memory") || prompt.includes("connect")
                    ? {
                        subagent: "memory_digging",
                        confidence: "high",
                        reason: "The prompt is asking to connect this memory to an earlier one.",
                        suggested_task: "story.connect_related_memory",
                      }
              : prompt.includes("tag")
                ? {
                    subagent: "metadata",
                    confidence: "high",
                    reason: "The prompt is asking for tags or keywords that organize the memory.",
                    suggested_task: "story.suggest_tags",
                  }
              : prompt.includes("theme") || prompt.includes("classif")
                ? {
                    subagent: "metadata",
                    confidence: "high",
                    reason: "The prompt is about labeling or organizing the memory metadata.",
                    suggested_task: "story.classify_memory",
                  }
                : {
                    subagent: "conversation",
                    confidence: "medium",
                    reason: "The prompt looks conversational.",
                    suggested_task: "assistant.compose_response",
                  };
          setResult(routeResult);
          setStatus("completed");
          return {
            status: "completed",
            task: definition.task,
            mode: "assist",
            result: routeResult,
            meta: null,
            error: null,
            lastUpdatedAt: Date.now(),
          };
        }

        if (definition.task === "assistant.compose_response") {
          const prompt = (input as { prompt?: string } | undefined)?.prompt?.toLowerCase() ?? "";
          if (prompt.includes("server down")) {
            runOptions?.onError?.({
              message: "Unsupported assistant compose task",
              status: 505,
            });
            return undefined;
          }

          const resultPayload = {
            text: "This memory seems to carry more emotional meaning than the draft is naming yet. I can help you unpack that, connect it to earlier moments, or reshape the writing.",
          };
          setResult(resultPayload);
          setStatus("completed");
          return {
            status: "completed",
            task: definition.task,
            mode: "assist",
            result: resultPayload,
            meta: {
              summary: "Composed an assistant reply.",
              session_id: "assistant-session-1",
              run_id: "assistant-run-1",
              workflow_id: "conversation-agent",
              tool_calls: ["load-current-assistant-context"],
              progress: null,
              events: [],
            },
            error: null,
            lastUpdatedAt: Date.now(),
          };
        }

        if (definition.task === "story.rewrite_draft") {
          const rewriteResult = {
            tone: "storyteller",
            body: "Storyteller version\n\nThe dinner scene came back into focus with warmth and detail.",
            title: "Dinner",
            summary: "Draft rewritten in storyteller voice",
          };
          setResult(rewriteResult);
          setStatus("completed");
          return {
            status: "completed",
            task: definition.task,
            mode: "assist",
            result: rewriteResult,
            meta: null,
            error: null,
            lastUpdatedAt: Date.now(),
          };
        }

        if (definition.task === "story.identify_missing_details") {
          const resultPayload = {
            summary: "A few details would strengthen this memory.",
            missing_details: ["who was there", "how you felt", "what made the moment feel vivid"],
            suggested_questions: [
              "Who shared the moment with you?",
              "What emotion stayed with you afterward?",
              "What sounds, smells, textures, or the atmosphere made the moment feel real?",
            ],
          };
          setResult(resultPayload);
          setStatus("completed");
          return {
            status: "completed",
            task: definition.task,
            mode: "assist",
            result: resultPayload,
            meta: null,
            error: null,
            lastUpdatedAt: Date.now(),
          };
        }

        if (definition.task === "story.connect_related_memory") {
          const resultPayload = {
            summary: "This moment connects to an earlier family gathering.",
            related_memories: [
              {
                title: "Sunday Dinner",
                reason: "Both memories revolve around family closeness at the table.",
              },
            ],
            suggested_prompt:
              "Does this remind you of another family meal that shaped how you think about home?",
          };
          setResult(resultPayload);
          setStatus("completed");
          return {
            status: "completed",
            task: definition.task,
            mode: "assist",
            result: resultPayload,
            meta: null,
            error: null,
            lastUpdatedAt: Date.now(),
          };
        }

        if (definition.task === "story.suggest_title") {
          const resultPayload = {
            title: "Sunday Dinner",
          };
          setResult(resultPayload);
          setStatus("completed");
          return {
            status: "completed",
            task: definition.task,
            mode: "suggest",
            result: resultPayload,
            meta: null,
            error: null,
            lastUpdatedAt: Date.now(),
          };
        }

        if (definition.task === "story.suggest_tags") {
          const resultPayload = {
            tags: ["Family", "Tradition", "Home"],
          };
          setResult(resultPayload);
          setStatus("completed");
          return {
            status: "completed",
            task: definition.task,
            mode: "suggest",
            result: resultPayload,
            meta: null,
            error: null,
            lastUpdatedAt: Date.now(),
          };
        }

        if (definition.task === "story.classify_memory") {
          const resultPayload = {
            category: "relationships_people",
            category_label: "Relationships & People",
            dimensions: ["relationships_people", "everyday_life"],
            summary: "This draft is mainly about people and the closeness of a shared routine.",
          };
          setResult(resultPayload);
          setStatus("completed");
          return {
            status: "completed",
            task: definition.task,
            mode: "suggest",
            result: resultPayload,
            meta: null,
            error: null,
            lastUpdatedAt: Date.now(),
          };
        }

        if (definition.task === "archive.enrich_memory") {
          const resultPayload = {
            title: "Sunday Dinner",
            tags: ["Family", "Tradition", "Home"],
            category: "relationships_people",
            category_label: "Relationships & People",
            dimensions: ["relationships_people", "everyday_life"],
            summary: "Prepared enrichment suggestions for this memory.",
            next_action: "Apply these suggestions to the draft metadata.",
          };
          setResult(resultPayload);
          setStatus("completed");
          return {
            status: "completed",
            task: definition.task,
            mode: "assist",
            result: resultPayload,
            meta: null,
            error: null,
            lastUpdatedAt: Date.now(),
          };
        }

        return {
          status: "completed",
          task: definition.task,
          mode: "suggest",
          result: null,
          meta: null,
          error: null,
          lastUpdatedAt: Date.now(),
        };
      };

      return {
        task: definition.task,
        mode: definition.task === "story.rewrite_draft" ? "assist" : "suggest",
        state: {
          status,
          mode: definition.task === "story.rewrite_draft" ? "assist" : "suggest",
          task: definition.task,
          result,
          meta: null,
          error: null,
          lastUpdatedAt: status === "completed" ? Date.now() : null,
        },
        run,
        reset: vi.fn(),
        isLoading: false,
        isIdle: status === "idle",
        isRunning: false,
        isSuccess: status === "completed",
        isError: false,
        result,
        meta: null,
        error: null,
      };
    },
  };
});

vi.mock("@tiptap/react", () => {
  function chainable() {
    const api = { run: () => true };
    return new Proxy(api, {
      get(t, p) {
        if (p === "run") return t.run;
        return (...args: unknown[]) => {
          if (typeof p === "string" && p in editorCommandMocks) {
            editorCommandMocks[p as keyof typeof editorCommandMocks](...args);
          }
          return chainable();
        };
      },
    });
  }
  const editorMock = {
    getHTML: editorGetHTMLMock,
    getText: editorGetTextMock,
    getAttributes: () => ({}),
    isActive: editorIsActiveMock,
    commands: { focus: editorFocusMock, setContent: editorSetContentMock },
    chain: () => chainable(),
    options: {editorProps: {}},
    setOptions: vi.fn(),
    state: {
      selection: {
        from: 0,
        to: 0,
        $anchor: { parent: { textContent: "", parentOffset: 0 } },
      },
      doc: { textBetween: () => "" },
    },
    view: { coordsAtPos: () => ({ top: 0, left: 0 }) },
  };
  return {
    useEditor: () => editorMock,
    useEditorState: ({ selector }: { selector: (snapshot: { editor: typeof editorMock | null }) => unknown }) => {
      selector({ editor: null });
      return selector({ editor: editorMock });
    },
    EditorContent: () => <div data-testid="mock-editor" tabIndex={-1} />,
  };
});

vi.mock("@emoji-mart/react", () => ({
  default: () => (
    <div data-testid="emoji-mart-mock">
      <input aria-label="Search emojis" />
    </div>
  ),
}));

vi.mock("./file-thumbnails", () => ({
  FileThumbnails: () => <div data-testid="file-thumbnails-mock" />,
}));

vi.mock("react-modal-sheet", () => {
  function MockSheet({ children }: { children: ReactNode }) {
    return <div data-testid="mock-sheet">{children}</div>;
  }
  MockSheet.Container = ({ children, className }: { children: ReactNode; className?: string }) => (
    <div data-testid="sheet-container" className={className}>
      {children}
    </div>
  );
  MockSheet.Header = ({ className }: { className?: string }) => (
    <div data-testid="sheet-header" className={className} />
  );
  MockSheet.Content = ({ children, className }: { children: ReactNode; className?: string }) => (
    <div data-testid="sheet-content" className={className}>
      {children}
    </div>
  );
  MockSheet.Backdrop = () => null;
  return { Sheet: MockSheet };
});

function ComposerModal() {
  const { open } = useModal();
  return (
    <>
      <button onClick={() => open?.("create-memory")}>Open composer</button>
      <Modal />
    </>
  );
}

describe("CreateMemory", () => {
  beforeEach(() => {
    aiTaskRunMock.mockReset();
    editorSetContentMock.mockReset();
    editorGetHTMLMock.mockReset().mockReturnValue("");
    editorGetTextMock.mockReset().mockReturnValue("");
    editorIsActiveMock.mockReset().mockReturnValue(false);
    Object.values(editorCommandMocks).forEach((command) => command.mockReset());
    uploadState.files = null;
  });

  it("renders the desktop composer as a journal without changing the mobile sheet", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const { rerender } = renderWithProviders(<CreateMemory data={{}} isMobile={false} />, {
      auth: true,
      container,
    });

    expect(screen.getByTestId("desktop-story-environment")).toBeInTheDocument();
    expect(screen.getByTestId("desktop-journal-shell")).toBeInTheDocument();
    expect(screen.getByTestId("desktop-album-artwork")).toHaveAttribute("alt", "");
    expect(screen.getByTestId("desktop-album-artwork")).toHaveAttribute("src", albumArtwork);
    expect(screen.getByPlaceholderText(/give this story a title/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publish Story" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Preview" })).not.toBeInTheDocument();

    rerender(<CreateMemory data={{}} isMobile />);

    expect(screen.getByTestId("sheet-container")).toBeInTheDocument();
    expect(screen.queryByTestId("desktop-journal-shell")).not.toBeInTheDocument();
  });

  it("uses the dark album artwork for the desktop composer in dark mode", () => {
    localStorage.setItem("memento:theme", "dark");

    renderWithProviders(<CreateMemory data={{}} isMobile={false} />, { auth: true });

    expect(screen.getByTestId("desktop-album-artwork")).toHaveAttribute(
      "src",
      darkAlbumArtwork,
    );
  });

  it("uses v3 background on mobile sheet surfaces", () => {
    renderWithProviders(<CreateMemory data={{}} isMobile />, { auth: true });

    expect(screen.getByTestId("sheet-container").className).toContain("bg-v3-bg");
    expect(screen.getByTestId("sheet-header").className).toContain("bg-v3-bg");
    expect(screen.getByTestId("sheet-content").className).toContain("bg-v3-bg");
  });

  it("moves focus to the body editor when enter is pressed in the desktop title", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateMemory data={{}} isMobile={false} />, { auth: true });

    const titleInput = screen.getByPlaceholderText(/give this story a title/i);
    await user.type(titleInput, "A title");
    await user.keyboard("{Enter}");

    expect((titleInput as HTMLTextAreaElement).value).toBe("A title");
    expect(editorFocusMock).toHaveBeenCalled();
  });

  it("keeps the whole desktop title visible when resizing makes it wrap onto more lines", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateMemory data={{}} isMobile={false} />, { auth: true });
    const titleInput = screen.getByPlaceholderText(/give this story a title/i);
    let textHeight = 96;
    Object.defineProperty(titleInput, "scrollHeight", { configurable: true, get: () => textHeight });
    await user.type(titleInput, "A long story title");
    expect(titleInput).toHaveStyle({ height: "96px" });

    textHeight = 180;
    fireEvent(window, new Event("resize"));

    expect(titleInput).toHaveStyle({ height: "180px" });
  });

  it("shows the upload picker options from the composer toolbar", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateMemory data={{}} isMobile={false} />, { auth: true });

    const attachmentButton = screen.getByRole("button", { name: "Add attachment" });
    expect(attachmentButton).toHaveClass("text-text-inverse-strong");
    await user.click(attachmentButton);

    expect(attachmentButton).toHaveAttribute("data-slot", "dropdown-menu-trigger");
    expect(screen.getByText("Choose upload type")).toBeInTheDocument();
    expect(screen.getAllByText("Photos").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Videos").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Audio").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Documents").length).toBeGreaterThan(0);
  });

  it("uses the default shadcn presentation for the desktop attachment menu", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateMemory data={{}} isMobile={false} />, { auth: true });

    await user.click(screen.getByRole("button", { name: "Add attachment" }));

    const label = screen.getByText("Choose upload type").closest('[data-slot="dropdown-menu-label"]');
    const photoItem = screen.getByRole("menuitem", { name: "Photos" });
    const photoIcon = photoItem?.querySelector("svg");

    expect(label).not.toHaveClass("font-geist", "uppercase");
    expect(photoItem).not.toHaveClass("font-geist", "text-[15px]");
    expect(photoIcon).not.toHaveClass("text-[#e98246]");
    expect(photoItem?.closest('[data-slot="dropdown-menu-group"]')).not.toBeNull();
  });

  it.each(["Drafts"])("dismisses the desktop %s menu with Escape without closing the composer", async (menuName) => {
    const user = userEvent.setup();
    renderWithProviders(<ComposerModal />, { auth: true });

    await user.click(screen.getByRole("button", { name: "Open composer" }));
    await user.click(screen.getByRole("button", { name: menuName }));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(screen.getByTestId("desktop-journal-shell")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByTestId("desktop-journal-shell")).not.toBeInTheDocument();
  });

  it("dismisses the desktop attachment dropdown with Escape without closing the composer", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ComposerModal />, { auth: true });
    await user.click(screen.getByRole("button", { name: "Open composer" }));

    await user.click(screen.getByRole("button", { name: "Add attachment" }));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(screen.getByTestId("desktop-journal-shell")).toBeInTheDocument();
  });

  it("uses shadcn toggles that reflect the current editor formatting state", () => {
    editorIsActiveMock.mockImplementation((format: string) =>
      ["bold", "link", "bulletList"].includes(format),
    );
    renderWithProviders(<CreateMemory data={{}} isMobile={false} />, { auth: true });

    for (const label of ["Bold", "Italic", "Strikethrough", "Underline", "Link", "Bullet list"]) {
      expect(screen.getByRole("button", { name: label })).toHaveAttribute("data-slot", "toggle");
    }
    expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Italic" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Link" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Bullet list" })).toHaveAttribute("aria-pressed", "true");
  });

  it.each([
    ["Bold", "toggleBold"],
    ["Italic", "toggleItalic"],
    ["Strikethrough", "toggleStrike"],
    ["Underline", "toggleUnderline"],
    ["Bullet list", "toggleBulletList"],
  ] as const)("runs the Tiptap %s command without dropping editor focus", async (label, command) => {
    const user = userEvent.setup();
    renderWithProviders(<CreateMemory data={{}} isMobile={false} />, { auth: true });

    await user.click(screen.getByRole("button", { name: label }));

    expect(editorCommandMocks.focus).toHaveBeenCalled();
    expect(editorCommandMocks[command]).toHaveBeenCalled();
  });

  it("dismisses desktop sharing options with Escape without closing the composer", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ComposerModal />, { auth: true });
    await user.click(screen.getByRole("button", { name: "Open composer" }));
    const sharingTrigger = screen.getByLabelText("Who can see this story?");
    await user.click(sharingTrigger);
    await user.click(screen.getByPlaceholderText("Search user or group"));

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog", { name: "Sharing options" })).not.toBeInTheDocument();
    expect(screen.getByTestId("desktop-journal-shell")).toBeInTheDocument();
    expect(sharingTrigger).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(screen.queryByTestId("desktop-journal-shell")).not.toBeInTheDocument();
  });

  it("uses the shadcn visibility picker and preserves stored group colours", async () => {
    server.use(
      http.get("http://localhost:3000/api/groups", () =>
        HttpResponse.json({
          success: true,
          data: { docs: [{ _id: "group-friends", name: "Friends", color: 1 }] },
        }),
      ),
      http.get("http://localhost:3000/api/beneficiaries", () =>
        HttpResponse.json({
          success: true,
          data: { docs: [{ _id: "person-alex", name: "Alexander Wang" }] },
        }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<CreateMemory data={{}} isMobile={false} />, { auth: true });

    await user.click(screen.getByRole("button", { name: "Story Details" }));
    await user.click(screen.getByLabelText("Who can see this story?"));

    const picker = screen.getByRole("dialog", { name: "Sharing options" });
    expect(picker).toHaveAttribute("data-slot", "popover-content");
    expect(picker).toHaveClass("z-[220]");
    expect(screen.getByRole("group", { name: "Story visibility" })).toHaveAttribute(
      "data-slot",
      "toggle-group",
    );
    expect(await screen.findByRole("button", { name: "@Friends" })).toHaveClass(
      "bg-green-50",
      "text-green-600",
      "border-green-100",
    );
    expect(await screen.findByRole("checkbox", { name: "Alexander Wang" })).toHaveAttribute(
      "data-slot",
      "checkbox",
    );
  });

  it.each(["Link", "Insert emoji"])(
    "dismisses the desktop %s popover with Escape without closing the composer",
    async (triggerName) => {
      const user = userEvent.setup();
      renderWithProviders(<ComposerModal />, { auth: true });
      await user.click(screen.getByRole("button", { name: "Open composer" }));
      if (triggerName === "Insert emoji") {
        expect(screen.getByRole("button", { name: triggerName })).toHaveTextContent("🙂");
      }
      await user.click(screen.getByRole("button", { name: triggerName }));
      expect(triggerName === "Link"
        ? screen.getByPlaceholderText("Enter text to display...")
        : screen.getByTestId("emoji-mart-mock")).toBeInTheDocument();
      if (triggerName === "Insert emoji") {
        expect(screen.getByTestId("emoji-mart-mock").closest('[data-slot="popover-content"]')).not.toBeNull();
        const emojiSearch = screen.getByRole("textbox", { name: "Search emojis" });
        await user.click(emojiSearch);
        expect(emojiSearch).toHaveFocus();
      }

      await user.keyboard("{Escape}");

      expect(screen.queryByPlaceholderText("Enter text to display...")).not.toBeInTheDocument();
      expect(screen.queryByTestId("emoji-mart-mock")).not.toBeInTheDocument();
      expect(screen.getByTestId("desktop-journal-shell")).toBeInTheDocument();
      if (triggerName === "Insert emoji") {
        expect(screen.getByRole("button", { name: "Insert emoji" })).toHaveFocus();
      }
      await user.keyboard("{Escape}");
      expect(screen.queryByTestId("desktop-journal-shell")).not.toBeInTheDocument();
    },
  );

  it("starts with Story Details collapsed and restores focus after closing it", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateMemory data={{}} isMobile={false} />, { auth: true });

    const openDetails = screen.getByRole("button", { name: "Story Details" });
    expect(openDetails).toHaveAttribute("aria-expanded", "false");
    expect(openDetails).toHaveAttribute("aria-controls", "story-details-panel");
    expect(screen.queryByRole("tab", { name: "Story Details" })).not.toBeInTheDocument();

    await user.click(openDetails);

    const detailsTab = screen.getByRole("tab", { name: "Story Details" });
    expect(screen.getByRole("complementary")).toHaveAttribute("id", "story-details-panel");
    expect(detailsTab).toHaveFocus();

    await user.click(screen.getByRole("button", { name: "Collapse story details" }));

    const restoredTrigger = screen.getByRole("button", { name: "Story Details" });
    expect(restoredTrigger).toHaveAttribute("aria-expanded", "false");
    expect(restoredTrigger).toHaveFocus();
  });

  it("uses theme tokens for the desktop property panel and formatting strip", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateMemory data={{}} isMobile={false} />, { auth: true });

    expect(screen.getByTestId("desktop-formatting-strip")).toHaveClass("bg-fill-neutral-weak");
    expect(screen.getByTestId("desktop-story-date-icon")).toHaveAttribute("src", calendarIcon);

    await user.click(screen.getByRole("button", { name: "Story Details" }));

    expect(screen.getByText("Who can see this story?")).toHaveClass("text-text-neutral-strong");
    expect(
      screen.getByText("Stories are visible to all beneficiaries by default. Choose", { exact: false }),
    ).toHaveTextContent("Stories are visible to all beneficiaries by default. Choose Private to hide them.");
    expect(screen.getByText("Private", { selector: "span" })).toHaveClass("text-text-error-strong");
    expect(screen.getByTestId("story-visibility-icon")).toHaveAttribute("src", privateIcon);
    expect(screen.getByLabelText("Who can see this story?")).toHaveClass("bg-fill-neutral-weak");
    await user.click(screen.getByLabelText("Who can see this story?"));
    await user.click(screen.getByRole("option", { name: /Everyone/i }));
    expect(screen.getByTestId("story-visibility-icon")).toHaveAttribute("src", everyoneIcon);
    expect(screen.getByText("Add Tags")).toHaveClass("text-text-neutral-strong");
    expect(screen.getByRole("button", { name: "Auto tag" })).toHaveClass(
      "bg-fill-info-weak",
      "text-text-info-strong",
    );
    expect(screen.getByPlaceholderText("Manually add tags or click to autogenerate").parentElement)
      .toHaveClass("bg-fill-neutral-weak");
    expect(screen.getByText("Story Overview")).toHaveClass("text-text-neutral-strong");
  });

  it("removes manual draft saving from Story Details", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateMemory data={{}} isMobile={false} />, { auth: true });

    await user.click(screen.getByRole("button", { name: "Story Details" }));

    expect(screen.queryByRole("button", { name: "Save Draft" })).not.toBeInTheDocument();
  });

  it("offers shadcn draft actions when closing an unsaved desktop story", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ComposerModal />, { auth: true });
    await user.click(screen.getByRole("button", { name: "Open composer" }));
    await user.type(screen.getByPlaceholderText(/give this story a title/i), "A story to keep");

    await user.click(screen.getByRole("button", { name: "Close" }));

    const dialog = screen.getByRole("dialog", { name: "Save this story?" });
    expect(dialog).toHaveAttribute("data-slot", "dialog-content");
    expect(dialog).toHaveClass("z-[310]");
    expect(document.querySelector('[data-slot="dialog-overlay"]')).toHaveClass("z-[300]");
    expect(screen.getByRole("button", { name: "Save draft and exit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Discard" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Keep editing" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(screen.getByTestId("desktop-journal-shell")).toBeInTheDocument();
  });

  it("saves an unsaved desktop story before exiting", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ComposerModal />, { auth: true });
    await user.click(screen.getByRole("button", { name: "Open composer" }));
    await user.type(screen.getByPlaceholderText(/give this story a title/i), "A saved exit");
    await user.click(screen.getByRole("button", { name: "Close" }));

    await user.click(screen.getByRole("button", { name: "Save draft and exit" }));

    expect(JSON.parse(localStorage.getItem("create-memory-drafts") ?? "[]")[0].title).toBe("A saved exit");
    expect(screen.queryByTestId("desktop-journal-shell")).not.toBeInTheDocument();
  });

  it("closes an empty desktop story without prompting", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ComposerModal />, { auth: true });
    await user.click(screen.getByRole("button", { name: "Open composer" }));

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.queryByRole("dialog", { name: "Save this story?" })).not.toBeInTheDocument();
    expect(screen.queryByTestId("desktop-journal-shell")).not.toBeInTheDocument();
  });

  it("shows assistant content when the Assistant tab is selected", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateMemory data={{}} isMobile={false} />, { auth: true });
    await user.click(screen.getByRole("button", { name: "Story Details" }));

    const detailsTab = screen.getByRole("tab", { name: "Story Details" });
    const assistantTab = screen.getByRole("tab", { name: "Assistant" });
    expect(detailsTab).toHaveAttribute("aria-selected", "true");
    await user.click(assistantTab);

    expect(assistantTab).toHaveAttribute("data-active");
    expect(assistantTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel", { name: "Assistant" })).toHaveAttribute(
      "aria-labelledby",
      assistantTab.id,
    );
    expect(screen.getByText(/assistant coming soon!/i)).toBeInTheDocument();
    expect(screen.getByText(/writing your journals and recalling important contexts/i)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/ask anything here\. use @ for context\./i)).not.toBeInTheDocument();

    await user.click(detailsTab);
    expect(detailsTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel", { name: "Story Details" })).toBeVisible();
  });

  it("stacks the Story Details tabs above their scrollable panel", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateMemory data={{}} isMobile={false} />, { auth: true });
    await user.click(screen.getByRole("button", { name: "Story Details" }));

    expect(screen.getByRole("tablist").closest('[data-slot="tabs"]')).toHaveClass("flex-col");
  });

  it("lets the active Assistant panel fill the available vertical space", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateMemory data={{}} isMobile={false} />, { auth: true });

    await user.click(screen.getByRole("button", { name: "Story Details" }));
    await user.click(screen.getByRole("tab", { name: "Assistant" }));
    const assistantPanel = screen.getByRole("tabpanel", { name: "Assistant" });
    expect(assistantPanel).toHaveClass("data-active:flex", "data-active:flex-col");
    expect(screen.queryByRole("tabpanel", { name: "Story Details" })).not.toBeInTheDocument();
  });

  it("reports an autosaved local draft only while the saved content matches the composer", async () => {
    vi.useFakeTimers();
    try {
      renderWithProviders(<CreateMemory data={{}} isMobile={false} />, { auth: true });

      const titleInput = screen.getByPlaceholderText(/give this story a title/i);
      expect(screen.getByRole("status")).toHaveTextContent("Not saved");

      fireEvent.change(titleInput, { target: { value: "A day to remember" } });
      await act(async () => { await vi.advanceTimersByTimeAsync(900); });

      expect(screen.getByRole("status")).toHaveTextContent("Draft saved");
      expect(JSON.parse(localStorage.getItem("create-memory-drafts") ?? "[]")[0].title).toBe("A day to remember");

      fireEvent.change(titleInput, { target: { value: "A day to remember together" } });

      expect(screen.getByRole("status")).toHaveTextContent("Not saved");
    } finally {
      vi.useRealTimers();
    }
  });

  it("updates one autosaved draft instead of creating a new draft for every edit", async () => {
    vi.useFakeTimers();
    try {
      renderWithProviders(<CreateMemory data={{}} isMobile={false} />, { auth: true });
      const titleInput = screen.getByPlaceholderText(/give this story a title/i);

      fireEvent.change(titleInput, { target: { value: "First title" } });
      await act(async () => { await vi.advanceTimersByTimeAsync(900); });

      const firstSave = JSON.parse(localStorage.getItem("create-memory-drafts") ?? "[]");
      expect(firstSave).toHaveLength(1);
      const draftId = firstSave[0].id;

      fireEvent.change(titleInput, { target: { value: "Updated title" } });
      await act(async () => { await vi.advanceTimersByTimeAsync(900); });

      const secondSave = JSON.parse(localStorage.getItem("create-memory-drafts") ?? "[]");
      expect(secondSave).toHaveLength(1);
      expect(secondSave[0]).toMatchObject({ id: draftId, title: "Updated title" });
    } finally {
      vi.useRealTimers();
    }
  });

  it("keeps Clear all in the Story composer dropdown header", async () => {
    vi.useFakeTimers();
    renderWithProviders(<CreateMemory data={{}} isMobile={false} />, { auth: true });
    fireEvent.change(screen.getByPlaceholderText(/give this story a title/i), {
      target: { value: "Menu draft" },
    });
    await act(async () => { await vi.advanceTimersByTimeAsync(900); });
    vi.useRealTimers();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Drafts" }));

    const clearAll = screen.getByRole("button", { name: "Clear all" });
    const header = clearAll.closest('[data-slot="dropdown-menu-label"]');
    expect(header).toHaveTextContent("Story composer");
    expect(header).toHaveClass("flex", "justify-between");
  });

  it.each(["A local story", "  A local story  "])("marks edits saved only after local autosave persists the raw title %j and body", async (title) => {
    vi.useFakeTimers();
    try {
      renderWithProviders(<CreateMemory data={{}} isMobile={false} />, { auth: true });
      const titleInput = screen.getByPlaceholderText(/give this story a title/i);
      editorGetTextMock.mockReturnValue("An afternoon together");
      editorGetHTMLMock.mockReturnValue("<p>An afternoon together</p>");
      fireEvent.change(titleInput, { target: { value: title } });

      expect(screen.getByRole("status")).toHaveTextContent("Not saved");
      await act(async () => { await vi.advanceTimersByTimeAsync(899); });
      expect(localStorage.getItem("create-memory-drafts")).toBeNull();
      expect(screen.getByRole("status")).toHaveTextContent("Not saved");

      await act(async () => { await vi.advanceTimersByTimeAsync(1); });
      expect(JSON.parse(localStorage.getItem("create-memory-drafts") ?? "[]")[0]).toMatchObject({
        title,
        body: "<p>An afternoon together</p>",
      });
      expect(screen.getByRole("status")).toHaveTextContent("Draft saved");

      editorGetTextMock.mockReturnValue("A bright afternoon together");
      editorGetHTMLMock.mockReturnValue("<p>A bright afternoon together</p>");
      fireEvent.change(titleInput, { target: { value: "An updated local story" } });
      expect(screen.getByRole("status")).toHaveTextContent("Not saved");

      await act(async () => { await vi.advanceTimersByTimeAsync(900); });
      expect(JSON.parse(localStorage.getItem("create-memory-drafts") ?? "[]")[0]).toMatchObject({
        title: "An updated local story",
        body: "<p>A bright afternoon together</p>",
      });
      expect(screen.getByRole("status")).toHaveTextContent("Draft saved");
    } finally {
      vi.useRealTimers();
    }
  });

  it.each(["Stored story", "  Stored story  "])("recognizes loaded local draft %j as saved without changing its raw title", async (title) => {
    const user = userEvent.setup();
    const draft = {
      id: "stored-draft",
      title,
      body: "<p>A saved afternoon</p>",
      tags: ["Family"],
      attachments: [],
      updatedAt: "2026-09-23T00:00:00.000Z",
    };
    localStorage.setItem("create-memory-drafts", JSON.stringify([draft]));
    editorSetContentMock.mockImplementation((html: string) => {
      editorGetHTMLMock.mockReturnValue(html);
      editorGetTextMock.mockReturnValue("A saved afternoon");
    });
    renderWithProviders(<CreateMemory data={{}} isMobile={false} />, { auth: true });
    expect(screen.getByRole("status")).toHaveTextContent("Not saved");

    await user.click(screen.getByRole("button", { name: "Drafts" }));
    await user.click(screen.getByRole("button", { name: /^Stored story/ }));

    expect(screen.getByPlaceholderText(/give this story a title/i)).toHaveValue(draft.title);
    expect(editorSetContentMock).toHaveBeenCalledWith(draft.body);
    expect(screen.getByRole("status")).toHaveTextContent("Draft saved");
    expect(JSON.parse(localStorage.getItem("create-memory-drafts") ?? "[]")[0].title).toBe(title);
  });

  it("keeps whitespace in a title when its pending autosave completes", async () => {
    vi.useFakeTimers();
    try {
      renderWithProviders(<CreateMemory data={{}} isMobile={false} />, { auth: true });
      const title = "  A day to remember  ";
      fireEvent.change(screen.getByPlaceholderText(/give this story a title/i), { target: { value: title } });
      expect(screen.getByRole("status")).toHaveTextContent("Not saved");

      await act(async () => { await vi.advanceTimersByTimeAsync(900); });

      expect(JSON.parse(localStorage.getItem("create-memory-drafts") ?? "[]")[0].title).toBe(title);
      expect(screen.getByRole("status")).toHaveTextContent("Draft saved");
    } finally {
      vi.useRealTimers();
    }
  });

  it("marks a saved draft unsaved when only the body formatting changes", async () => {
    vi.useFakeTimers();
    try {
      editorGetTextMock.mockReturnValue("A warm afternoon");
      editorGetHTMLMock.mockReturnValue("<p>A warm afternoon</p>");
      const container = document.createElement("div");
      document.body.appendChild(container);
      const { rerender } = renderWithProviders(<CreateMemory data={{}} isMobile={false} />, { auth: true, container });

      await act(async () => { await vi.advanceTimersByTimeAsync(900); });
      expect(screen.getByRole("status")).toHaveTextContent("Draft saved");
      expect(JSON.parse(localStorage.getItem("create-memory-drafts") ?? "[]")[0].body).toBe("<p>A warm afternoon</p>");

      editorGetHTMLMock.mockReturnValue("<p>A <strong>warm</strong> afternoon</p>");
      rerender(<CreateMemory data={{}} isMobile={false} />);

      expect(screen.getByRole("status")).toHaveTextContent("Not saved");
    } finally {
      vi.useRealTimers();
    }
  });

  it("never reports saved while an upload is pending and compares only persisted attachments", async () => {
    vi.useFakeTimers();
    try {
      const uploadedFile = { _id: "photo-1", url: "/photo.jpg", name: "photo.jpg", size: 1024, type: "image/jpeg" };
      uploadState.files = [
        { id: "uploaded-client-id", file: null, progress: 100, uploadedFile },
        { id: "pending-upload", file: new File(["photo"], "pending.jpg", { type: "image/jpeg" }), progress: 25 },
      ];
      const container = document.createElement("div");
      document.body.appendChild(container);
      const { rerender } = renderWithProviders(<CreateMemory data={{}} isMobile={false} />, { auth: true, container });
      fireEvent.change(screen.getByPlaceholderText(/give this story a title/i), { target: { value: "Uploading story" } });

      await act(async () => { await vi.advanceTimersByTimeAsync(900); });

      expect(screen.getByRole("status")).toHaveTextContent("Not saved");
      expect(JSON.parse(localStorage.getItem("create-memory-drafts") ?? "[]")[0].attachments).toEqual([uploadedFile]);

      uploadState.files = [uploadState.files[0]];
      rerender(<CreateMemory data={{}} isMobile={false} />);

      expect(screen.getByRole("status")).toHaveTextContent("Draft saved");
    } finally {
      vi.useRealTimers();
    }
  });

  it("invalidates saved status when all local drafts are cleared", async () => {
    vi.useFakeTimers();
    renderWithProviders(<CreateMemory data={{}} isMobile={false} />, { auth: true });
    fireEvent.change(screen.getByPlaceholderText(/give this story a title/i), { target: { value: "Saved story" } });
    await act(async () => { await vi.advanceTimersByTimeAsync(900); });
    vi.useRealTimers();

    const user = userEvent.setup();
    expect(screen.getByRole("status")).toHaveTextContent("Draft saved");
    await user.click(screen.getByRole("button", { name: "Drafts" }));
    await user.click(screen.getByRole("button", { name: "Clear all" }));

    expect(screen.getByRole("status")).toHaveTextContent("Not saved");
    expect(JSON.parse(localStorage.getItem("create-memory-drafts") ?? "[]")).toEqual([]);
  });

  it("invalidates saved status when the saved draft is deleted", async () => {
    vi.useFakeTimers();
    renderWithProviders(<CreateMemory data={{}} isMobile={false} />, { auth: true });
    fireEvent.change(screen.getByPlaceholderText(/give this story a title/i), { target: { value: "Saved story" } });
    await act(async () => { await vi.advanceTimersByTimeAsync(900); });
    vi.useRealTimers();

    const user = userEvent.setup();
    expect(screen.getByRole("status")).toHaveTextContent("Draft saved");
    await user.click(screen.getByRole("button", { name: "Drafts" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(screen.getByRole("status")).toHaveTextContent("Not saved");
    expect(JSON.parse(localStorage.getItem("create-memory-drafts") ?? "[]")).toEqual([]);
  });

  it.skip("can rewrite the draft from a chat request and update the journal draft", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateMemory data={{}} isMobile={false} />, { auth: true });

    await user.type(screen.getByPlaceholderText(/enter title here/i), "Dinner");
    await user.click(screen.getByRole("button", { name: "Assistant" }));
    await user.type(
      screen.getByPlaceholderText(/ask anything here\. use @ for context\./i),
      "Rewrite this in storyteller voice",
    );
    await user.click(screen.getByRole("button", { name: /^send$/i }));

    expect(aiTaskRunMock).toHaveBeenCalledWith("assistant.select_subagent", {
      prompt: "Rewrite this in storyteller voice",
      surface: "story_composer",
    });
    expect(aiTaskRunMock).toHaveBeenNthCalledWith(2, "story.rewrite_draft", {
      title: "Dinner",
      body: "",
      tone: "storyteller",
    });
    expect(await screen.findByText(/storyteller version/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /update journal draft/i }));

    expect(editorSetContentMock).toHaveBeenCalled();
  });

  it.skip("uses a chat-first assistant instead of fixed prompt chips", async () => {
    renderWithProviders(<CreateMemory data={{}} isMobile={false} />, { auth: true });

    await userEvent.setup().click(screen.getByRole("button", { name: "Assistant" }));
    expect(screen.queryByRole("button", { name: /storyteller/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /turn notes into draft/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /suggest a title/i })).toBeInTheDocument();
  });

  it("anchors the desktop media section near the bottom of the writing surface", () => {
    renderWithProviders(<CreateMemory data={{}} isMobile={false} />, { auth: true });

    const scrollSurface = screen.getByTestId("desktop-composer-scroll-surface");
    const mediaSection = screen.getByTestId("desktop-composer-media-section");

    expect(scrollSurface.className).toContain("min-h-full");
    expect(mediaSection.className).toContain("mt-auto");
  });

  it("shows story quality as a quiet checklist instead of a percentage chart", () => {
    renderWithProviders(<CreateMemory data={{}} isMobile={false} />, { auth: true });

    expect(screen.getByText("Story quality")).toBeInTheDocument();
    expect(screen.getByText("Characters")).toBeInTheDocument();
    expect(screen.getByText("Sensory details")).toBeInTheDocument();
    expect(screen.queryByText(/^(?:strong story|good start|keep going)$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\d+%/)).not.toBeInTheDocument();
  });

  it.skip("returns sensory guidance from a freeform assistant request", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateMemory data={{}} isMobile={false} />, { auth: true });

    await user.click(screen.getByRole("button", { name: "Assistant" }));
    await user.type(
      screen.getByPlaceholderText(/ask anything here\. use @ for context\./i),
      "Add sensory details",
    );
    await user.click(screen.getByRole("button", { name: /^send$/i }));

    expect(await screen.findByText(/sounds, smells, textures, or the atmosphere/i)).toBeInTheDocument();
  });

  it.skip("returns coaching on missing details from a freeform assistant request", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateMemory data={{}} isMobile={false} />, { auth: true });

    await user.click(screen.getByRole("button", { name: "Assistant" }));
    await user.type(
      screen.getByPlaceholderText(/ask anything here\. use @ for context\./i),
      "What details are missing?",
    );
    await user.click(screen.getByRole("button", { name: /^send$/i }));

    expect(aiTaskRunMock).toHaveBeenNthCalledWith(2, "story.identify_missing_details", {
      title: "",
      body: "",
    });
    expect(await screen.findByText(/who was there/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /apply title/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /apply tags/i })).not.toBeInTheDocument();
  });

  it.skip("returns related-memory guidance from a freeform assistant request", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateMemory data={{}} isMobile={false} />, { auth: true });

    await user.click(screen.getByRole("button", { name: "Assistant" }));
    await user.type(
      screen.getByPlaceholderText(/ask anything here\. use @ for context\./i),
      "Connect to a past memory",
    );
    await user.click(screen.getByRole("button", { name: /^send$/i }));

    expect(aiTaskRunMock).toHaveBeenNthCalledWith(2, "story.connect_related_memory", {
      title: "",
      body: "",
    });
    expect(await screen.findByText(/sunday dinner/i)).toBeInTheDocument();
    expect(
      screen.getByText(/both memories revolve around family closeness at the table/i),
    ).toBeInTheDocument();
  });

  it.skip("routes a freeform title request through the conversation agent and returns an apply action", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateMemory data={{}} isMobile={false} />, { auth: true });

    await user.click(screen.getByRole("button", { name: "Assistant" }));
    await user.type(
      screen.getByPlaceholderText(/ask anything here\. use @ for context\./i),
      "Can you suggest a better title for this memory?",
    );
    await user.click(screen.getByRole("button", { name: /^send$/i }));

    expect(aiTaskRunMock).toHaveBeenCalledWith("assistant.select_subagent", {
      prompt: "Can you suggest a better title for this memory?",
      surface: "story_composer",
    });
    expect(aiTaskRunMock).toHaveBeenCalledWith("story.suggest_title", {
      title: "",
      body: "",
    });
    expect(await screen.findByText(/suggested title: sunday dinner/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /apply title/i })).toBeInTheDocument();
  });

  it.skip("routes a freeform classification request through the conversation agent", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateMemory data={{}} isMobile={false} />, { auth: true });

    await user.click(screen.getByRole("button", { name: "Assistant" }));
    await user.type(
      screen.getByPlaceholderText(/ask anything here\. use @ for context\./i),
      "What theme is this memory really about?",
    );
    await user.click(screen.getByRole("button", { name: /^send$/i }));

    expect(aiTaskRunMock).toHaveBeenCalledWith("assistant.select_subagent", {
      prompt: "What theme is this memory really about?",
      surface: "story_composer",
    });
    expect(aiTaskRunMock).toHaveBeenCalledWith("story.classify_memory", {
      title: "",
      body: "",
    });
    expect(
      await screen.findByText(/primary category: relationships & people/i),
    ).toBeInTheDocument();
  });

  it.skip("routes general conversation prompts through the assistant compose task instead of local canned copy", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateMemory data={{}} isMobile={false} />, { auth: true });

    await user.type(screen.getByPlaceholderText(/enter title here/i), "Dinner");
    await user.click(screen.getByRole("button", { name: "Assistant" }));
    await user.type(
      screen.getByPlaceholderText(/ask anything here\. use @ for context\./i),
      "Can you help me think through why this memory matters?",
    );
    await user.click(screen.getByRole("button", { name: /^send$/i }));

    expect(aiTaskRunMock).toHaveBeenCalledWith("assistant.select_subagent", {
      prompt: "Can you help me think through why this memory matters?",
      surface: "story_composer",
    });
    expect(aiTaskRunMock).toHaveBeenNthCalledWith(2, "assistant.compose_response", {
      prompt: "Can you help me think through why this memory matters?",
      surface: "story_composer",
      title: "Dinner",
      tone: "whimsical",
      uploaded_file_ids: [],
      uploaded_media_count: 0,
      uploaded_document_count: 0,
      messages: [
        {
          role: "user",
          content: "Can you help me think through why this memory matters?",
        },
      ],
    });
    expect(
      await screen.findByText(/this memory seems to carry more emotional meaning/i),
    ).toBeInTheDocument();
  });

  it.skip("can return contextual archive enrichment actions from chat", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateMemory data={{}} isMobile={false} />, { auth: true });

    await user.click(screen.getByRole("button", { name: "Assistant" }));
    await user.type(
      screen.getByPlaceholderText(/ask anything here\. use @ for context\./i),
      "Can you enrich this memory for my archive?",
    );
    await user.click(screen.getByRole("button", { name: /^send$/i }));

    expect(aiTaskRunMock).toHaveBeenCalledWith("assistant.select_subagent", {
      prompt: "Can you enrich this memory for my archive?",
      surface: "story_composer",
    });
    expect(aiTaskRunMock).toHaveBeenNthCalledWith(2, "archive.enrich_memory", {});
    expect(await screen.findByText(/prepared enrichment suggestions for this memory/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /apply enrichment/i })).toBeInTheDocument();
  });

  it.skip("stops retrying assistant.compose_response after a server error and falls back locally", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateMemory data={{}} isMobile={false} />, { auth: true });

    await user.click(screen.getByRole("button", { name: "Assistant" }));

    const input = screen.getByPlaceholderText(/ask anything here\. use @ for context\./i);
    await user.type(input, "Server down why does this memory matter?");
    await user.click(screen.getByRole("button", { name: /^send$/i }));

    expect(
      await screen.findByText(/i will keep the guidance warm and lightly imaginative/i),
    ).toBeInTheDocument();
    expect(aiTaskRunMock).toHaveBeenCalledWith("assistant.compose_response", {
      prompt: "Server down why does this memory matter?",
      surface: "story_composer",
      tone: "whimsical",
      uploaded_file_ids: [],
      uploaded_media_count: 0,
      uploaded_document_count: 0,
      messages: [
        {
          role: "user",
          content: "Server down why does this memory matter?",
        },
      ],
    });

    await user.type(input, "Can you help me think through this one more time?");
    await user.click(screen.getByRole("button", { name: /^send$/i }));

    expect(aiTaskRunMock).toHaveBeenCalledWith("assistant.select_subagent", {
      prompt: "Can you help me think through this one more time?",
      surface: "story_composer",
    });
    expect(
      aiTaskRunMock.mock.calls.filter(([task]) => task === "assistant.compose_response"),
    ).toHaveLength(1);
  });
});
