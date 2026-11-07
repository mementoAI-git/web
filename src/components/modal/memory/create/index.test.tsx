import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
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
import {
  MEMORY_ACCEPT_AUDIO,
  MEMORY_ACCEPT_DOCUMENTS,
  MEMORY_ACCEPT_IMAGES,
  MEMORY_ACCEPT_VIDEOS,
} from "@/utility/constant";
import albumArtwork from "@/assets/image/HD Album story bg memento.webp";
import referenceAlbum from "@/assets/image/story-overlay-c-tall-album.webp";
import darkAlbumArtwork from "@/assets/image/HD Album story bg memento dark.webp";
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

describe("publish upload readiness", () => {
  it("blocks publishing unconfirmed 100% attachments", () => {
    uploadState.files = [{ id: "pending", file: new File(["image"], "photo.png"), progress: 100 }];
    try {
      renderWithProviders(<CreateMemory />);
      expect(screen.getByRole("button", { name: /publish story/i })).toBeDisabled();
    } finally { uploadState.files = null; }
  });
  it("keeps a failed attachment visible with a retry action and blocks publishing", () => {
    uploadState.files = [{ id: "failed", file: new File(["image"], "photo.png", { type: "image/png" }), base64: "data:image/png;base64,a", progress: 80, uploadFailed: true }];
    try {
      renderWithProviders(<CreateMemory />);
      expect(screen.getByTestId("file-thumbnails-mock")).toHaveAttribute("data-retry-enabled", "true");
      expect(screen.getByRole("button", { name: /publish story/i })).toBeDisabled();
    } finally { uploadState.files = null; }
  });
});

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
  FileThumbnails: ({ onRetry, onRemove, files }: { onRetry?: unknown; onRemove: (id: string) => void; files: IOnUploadPayload[] }) => <div data-testid="file-thumbnails-mock" data-retry-enabled={Boolean(onRetry)}>{files.map((file) => <button key={file.id} aria-label={`Remove test attachment ${file.id}`} onClick={() => onRemove(file.id)}>Remove</button>)}</div>,
}));

vi.mock("react-modal-sheet", () => {
  function MockSheet({ children, isOpen = true }: { children: ReactNode; isOpen?: boolean }) {
    return isOpen ? <div data-testid="mock-sheet">{children}</div> : null;
  }
  MockSheet.Container = ({ children, className }: { children: ReactNode; className?: string }) => (
    <div data-testid="sheet-container" className={className}>
      {children}
    </div>
  );
  MockSheet.Header = ({ className, children }: { className?: string; children?: ReactNode }) => (
    <div data-testid="sheet-header" className={className}>
      {children}
    </div>
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

function MobileComposerModal() {
  const { open, state } = useModal();
  return (
    <>
      <button onClick={() => open?.("create-memory")}>Open composer</button>
      {state.some((modal) => modal.name === "create-memory") ? <CreateMemory data={{}} isMobile /> : null}
    </>
  );
}

describe("CreateMemory", () => {
  it("opens overlay C with the leather cover and layered pages while preserving composer controls", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateMemory data={{}} isMobile={false} />, { auth: true, route: "/overview?storyOverlay=C" });
    expect(screen.getByRole("dialog", { name: "Add Story" })).toHaveAttribute("data-story-presentation", "overlay-c");
    expect(screen.getByTestId("desktop-album-artwork")).toHaveAttribute("src", referenceAlbum);
    expect(screen.getByTestId("desktop-album-artwork")).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByTestId("album-c-page-layer")).not.toBeInTheDocument();
    expect(screen.queryByTestId("desktop-paper-grain")).not.toBeInTheDocument();
    expect(screen.queryByTestId("desktop-story-environment")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText(/give this story a title/i)).toBeInTheDocument();
    for (const name of ["Publish Story", "Drafts", "Add attachment", "Insert emoji", "Record audio", "Record video"]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
    await user.click(screen.getByRole("button", { name: "Details" }));
    const panel = document.getElementById("story-details-panel");
    expect(document.querySelector(".album-c-content")?.contains(panel)).toBe(false);
    expect(document.querySelector(".album-c-sidecar")?.contains(panel)).toBe(true);
    expect(screen.getByRole("button", { name: "Collapse story details" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Assistant" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Collapse story details" }));
    expect(screen.getByRole("button", { name: "Details" })).toHaveFocus();
  });

  beforeEach(() => {
    aiTaskRunMock.mockReset();
    editorSetContentMock.mockReset();
    editorGetHTMLMock.mockReset().mockReturnValue("");
    editorGetTextMock.mockReset().mockReturnValue("");
    editorIsActiveMock.mockReset().mockReturnValue(false);
    Object.values(editorCommandMocks).forEach((command) => command.mockReset());
    uploadState.files = null;
  });

  it("defaults to overlay B without changing the mobile sheet", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const { rerender } = renderWithProviders(<CreateMemory data={{}} isMobile={false} />, {
      auth: true,
      container,
    });

    expect(screen.queryByTestId("desktop-story-environment")).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Add Story" })).toHaveAttribute("data-story-presentation", "overlay-b");
    expect(screen.getByTestId("desktop-journal-shell")).toBeInTheDocument();
    expect(screen.getByTestId("desktop-album-artwork")).toHaveAttribute("alt", "");
    expect(screen.getByTestId("desktop-album-artwork")).toHaveAttribute("src", albumArtwork);
    expect(screen.getByPlaceholderText(/give this story a title/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publish Story" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Preview" })).not.toBeInTheDocument();

    rerender(<CreateMemory data={{}} isMobile />);

    expect(screen.getByTestId("mobile-story-composer")).toBeInTheDocument();
    expect(screen.queryByTestId("desktop-journal-shell")).not.toBeInTheDocument();
  });

  it.each(["light", "dark"])("opens the default Add Story overlay with the %s album artwork and no scenic background", async (theme) => {
    localStorage.setItem("memento:theme", theme);
    const user = userEvent.setup();
    renderWithProviders(<ComposerModal />, { auth: true, route: "/overview" });
    await user.click(screen.getByRole("button", { name: "Open composer" }));
    expect(screen.getByRole("dialog", { name: "Add Story" })).toHaveClass("bg-bg-neutral");
    expect(screen.getByTestId("desktop-album-artwork")).toHaveAttribute("src", theme === "dark" ? darkAlbumArtwork : albumArtwork);
    expect(screen.queryByTestId("desktop-story-environment")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText(/give this story a title/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publish Story" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Add Story" })).not.toBeInTheDocument();
  });

  it.each(["B", "C"])("saves an unsaved story on close in overlay %s", async (overlay) => {
    // Keep autosave from running, so only closing can save this draft.
    const scheduleTimeout = window.setTimeout.bind(window);
    vi.spyOn(window, "setTimeout").mockImplementation((handler, timeout, ...args) =>
      scheduleTimeout(handler, timeout === 900 ? 60_000 : timeout, ...args),
    );
    const user = userEvent.setup();
    renderWithProviders(<ComposerModal />, { auth: true, route: `/overview?storyOverlay=${overlay}` });
    await user.click(screen.getByRole("button", { name: "Open composer" }));
    await user.type(screen.getByPlaceholderText(/give this story a title/i), "Overlay draft");
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(JSON.parse(localStorage.getItem("create-memory-drafts") ?? "[]")[0].title).toBe("Overlay draft");
    expect(screen.queryByRole("dialog", { name: "Add Story" })).not.toBeInTheDocument();
  }, 20_000);

  it.each(["/overview?storyOverlay=A", "/overview?storyOverlay=B", "/stories"])("keeps variant A hidden on %s", async (route) => {
    const user = userEvent.setup();
    renderWithProviders(<ComposerModal />, { auth: true, route });
    await user.click(screen.getByRole("button", { name: "Open composer" }));
    expect(screen.getByRole("dialog", { name: "Add Story" })).toHaveAttribute("data-story-presentation", "overlay-b");
    expect(screen.queryByTestId("desktop-story-environment")).not.toBeInTheDocument();
  });

  it("uses the dark album artwork for the desktop composer in dark mode", () => {
    localStorage.setItem("memento:theme", "dark");

    renderWithProviders(<CreateMemory data={{}} isMobile={false} />, { auth: true });

    expect(screen.getByTestId("desktop-album-artwork")).toHaveAttribute(
      "src",
      darkAlbumArtwork,
    );
  });

  describe("on a phone", () => {
    const setup = () => {
      const user = userEvent.setup();
      renderWithProviders(<CreateMemory data={{}} isMobile />, { auth: true });
      return user;
    };

    it("closes straight to a saved draft, with no discard prompt", async () => {
      // Keep autosave from running, so only closing can save this draft.
      const scheduleTimeout = window.setTimeout.bind(window);
      vi.spyOn(window, "setTimeout").mockImplementation((handler, timeout, ...args) =>
        scheduleTimeout(handler, timeout === 900 ? 60_000 : timeout, ...args),
      );
      const user = userEvent.setup();
      renderWithProviders(<MobileComposerModal />, { auth: true });
      await user.click(screen.getByRole("button", { name: "Open composer" }));
      await user.type(screen.getByRole("textbox", { name: "Title" }), "Keep me");
      await user.click(screen.getByRole("button", { name: "Cancel editing" }));
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      expect(screen.queryByRole("dialog", { name: "Add Story" })).not.toBeInTheDocument();
      expect(JSON.parse(localStorage.getItem("create-memory-drafts") ?? "[]")[0].title).toBe("Keep me");
    });

    it("opens one system picker for every attachment type, with no menu first", async () => {
      const click = vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(() => undefined);
      const user = setup();
      await user.click(screen.getByRole("button", { name: "Add attachment" }));
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
      expect(click).toHaveBeenCalledTimes(1);
      const picker = click.mock.contexts[0] as HTMLInputElement;
      expect(picker.multiple).toBe(true);
      const accepted = picker.accept.split(",");
      for (const list of [
        MEMORY_ACCEPT_IMAGES,
        MEMORY_ACCEPT_VIDEOS,
        MEMORY_ACCEPT_AUDIO,
        MEMORY_ACCEPT_DOCUMENTS,
      ]) {
        expect(accepted).toEqual(expect.arrayContaining(list.split(",")));
      }
      click.mockRestore();
    });

    it("uses the album paper for the writer's background", () => {
      setup();
      expect(screen.getByTestId("mobile-album-artwork")).toHaveClass("story-composer-paper");
    });

    it("opens a full-screen writer matching the mobile app", () => {
      setup();
      expect(screen.getByRole("dialog", { name: "Add Story" })).toHaveClass(
        "story-composer-mobile",
      );
      expect(screen.getByRole("textbox", { name: "Title" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Cancel editing" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Drafts" })).toBeInTheDocument();
      for (const name of [
        "Add attachment",
        "Record audio",
        "Bold",
        "Italic",
        "Underline",
        "Strikethrough",
        "Bullet list",
        "Numbered list",
      ]) {
        expect(
          within(screen.getByTestId("mobile-formatting-toolbar")).getByRole("button", { name }),
        ).toBeInTheDocument();
      }
    });

    it("keeps Next off until there is something to publish", async () => {
      const user = setup();
      const next = screen.getByRole("button", { name: "Next step" });
      expect(next).toBeDisabled();
      await user.type(screen.getByRole("textbox", { name: "Title" }), "This is the title");
      expect(next).toBeEnabled();
    });

    it("moves publishing to its own sheet with the mobile copy", async () => {
      const user = setup();
      expect(screen.queryByText("Publish post")).not.toBeInTheDocument();
      await user.type(screen.getByRole("textbox", { name: "Title" }), "This is the title");
      await user.click(screen.getByRole("button", { name: "Next step" }));
      expect(await screen.findByText("Publish post")).toBeVisible();
      expect(screen.getByText("New stories are private unless you choose otherwise.")).toBeVisible();
      expect(screen.getByText("Private · Only me")).toBeVisible();
      expect(screen.getByLabelText("Tags (optional)")).toHaveAttribute(
        "placeholder",
        "Add tags if you like",
      );
      expect(
        screen.getByText("Relevant tags will be added in the background if you leave this blank."),
      ).toBeVisible();
      expect(screen.getByRole("button", { name: /Autotag/ })).toBeVisible();
      expect(screen.getByRole("button", { name: /Post now/ })).toBeVisible();
    });
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

    await user.click(screen.getByRole("button", { name: "Details" }));
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

    const openDetails = screen.getByRole("button", { name: "Details" });
    expect(openDetails).toHaveAttribute("aria-expanded", "false");
    expect(openDetails).toHaveAttribute("aria-controls", "story-details-panel");
    expect(screen.queryByRole("tab", { name: "Story Details" })).not.toBeInTheDocument();

    await user.click(openDetails);

    const detailsTab = screen.getByRole("tab", { name: "Story Details" });
    expect(screen.getByRole("complementary")).toHaveAttribute("id", "story-details-panel");
    expect(detailsTab).toHaveFocus();

    await user.click(screen.getByRole("button", { name: "Collapse story details" }));

    const restoredTrigger = screen.getByRole("button", { name: "Details" });
    expect(restoredTrigger).toHaveAttribute("aria-expanded", "false");
    expect(restoredTrigger).toHaveFocus();
  });

  it("uses theme tokens for the desktop property panel and leaves the formatting strip unframed", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateMemory data={{}} isMobile={false} />, { auth: true });

    expect(screen.getByTestId("desktop-formatting-strip")).toHaveClass("px-3");
    expect(screen.getByTestId("desktop-formatting-strip")).not.toHaveClass("bg-fill-neutral-weak", "border", "py-2");
    expect(screen.getByTestId("desktop-story-date-icon")).toHaveAttribute("src", calendarIcon);

    await user.click(screen.getByRole("button", { name: "Details" }));

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
      "bg-transparent",
      "border-0",
      "text-text-brand-strong",
    );
    const autoTagIcon = screen.getByRole("button", { name: "Auto tag" }).querySelector('[aria-hidden="true"]');
    expect(autoTagIcon).toHaveClass("size-3", "bg-icon-brand-strong");
    expect(autoTagIcon?.getAttribute("style")).toContain("mask-image: url(");
    expect(screen.getByPlaceholderText("Manually add tags or click to autogenerate").parentElement)
      .toHaveClass("bg-fill-neutral-weak");
    expect(screen.getByText("Story Overview")).toHaveClass("text-text-neutral-strong");
  });

  it("removes manual draft saving from Story Details", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateMemory data={{}} isMobile={false} />, { auth: true });

    await user.click(screen.getByRole("button", { name: "Details" }));

    expect(screen.queryByRole("button", { name: "Save Draft" })).not.toBeInTheDocument();
  });

  it("saves an unsaved desktop story before exiting", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ComposerModal />, { auth: true });
    await user.click(screen.getByRole("button", { name: "Open composer" }));
    await user.type(screen.getByPlaceholderText(/give this story a title/i), "A saved exit");
    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(JSON.parse(localStorage.getItem("create-memory-drafts") ?? "[]")[0].title).toBe("A saved exit");
    expect(screen.queryByTestId("desktop-journal-shell")).not.toBeInTheDocument();
  });

  it("detaches a restored attachment only from the active draft", async () => {
    const user = userEvent.setup();
    const attachment = { _id: "shared-file", name: "photo.png", type: "image/png", url: "https://example.test/photo", size: 5 };
    localStorage.setItem("create-memory-drafts", JSON.stringify([
      { id: "active-draft", title: "Attachment draft", body: "", tags: [], attachments: [attachment], updatedAt: new Date().toISOString() },
      { id: "other-draft", title: "Keep this draft", body: "", tags: [], attachments: [attachment], updatedAt: new Date().toISOString() },
    ]));
    renderWithProviders(<ComposerModal />, { auth: true });
    await user.click(screen.getByRole("button", { name: "Open composer" }));
    await user.click(screen.getByRole("button", { name: "Drafts" }));
    await user.click(screen.getByRole("button", { name: /Attachment draft/ }));
    await user.click(screen.getByRole("button", { name: "Remove test attachment shared-file" }));
    const saved = JSON.parse(localStorage.getItem("create-memory-drafts") ?? "[]");
    expect(saved.find((draft: { id: string }) => draft.id === "active-draft").attachments).toEqual([]);
    expect(saved.find((draft: { id: string }) => draft.id === "other-draft").attachments).toEqual([attachment]);
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
    await user.click(screen.getByRole("button", { name: "Details" }));

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
    await user.click(screen.getByRole("button", { name: "Details" }));

    expect(screen.getByRole("tablist").closest('[data-slot="tabs"]')).toHaveClass("flex-col");
  });

  it("lets the active Assistant panel fill the available vertical space", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateMemory data={{}} isMobile={false} />, { auth: true });

    await user.click(screen.getByRole("button", { name: "Details" }));
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

  it.each([false, true])("moves the Drafts dot from muted to saving to saved as the draft autosaves (isMobile=%s)", async (isMobile) => {
    vi.useFakeTimers();
    try {
      const { container } = renderWithProviders(<CreateMemory data={{}} isMobile={isMobile} />, { auth: true });
      const dot = () => container.ownerDocument.querySelector('[data-slot="draft-status-dot"]');

      expect(screen.getByRole("button", { name: "Drafts" })).toContainElement(dot() as HTMLElement);
      expect(dot()).toHaveAttribute("data-status", "empty");
      expect(screen.getByRole("status")).toHaveClass("sr-only");

      const title = isMobile ? screen.getByLabelText("Title") : screen.getByPlaceholderText(/give this story a title/i);
      fireEvent.change(title, { target: { value: "A day to remember" } });
      expect(dot()).toHaveAttribute("data-status", "saving");

      await act(async () => { await vi.advanceTimersByTimeAsync(900); });
      expect(dot()).toHaveAttribute("data-status", "saved");
      expect(dot()).toHaveClass("bg-fill-success-strong");
    } finally {
      vi.useRealTimers();
    }
  });

  it("keeps Clear all in the shared Drafts dropdown header", async () => {
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
    expect(header).toHaveTextContent("Drafts");
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

  it("renders the Figma draft rows and deletes only the selected draft", async () => {
    const user = userEvent.setup();
    localStorage.setItem("create-memory-drafts", JSON.stringify([
      { id: "first", title: "First story", body: "<p>Body preview stays in the editor</p>", tags: [], attachments: [{ _id: "image", type: "image/png", url: "https://example.test/draft.png" }], updatedAt: "2026-10-14T13:01:00Z" },
      { id: "second", title: "Second story", body: "", tags: [], attachments: [], updatedAt: "2026-10-14T13:01:00Z" },
    ]));
    renderWithProviders(<CreateMemory data={{}} isMobile={false} />);
    await user.click(screen.getByRole("button", { name: "Drafts" }));
    const firstRow = screen.getByRole("button", { name: /First story/ }).closest(".drafts-menu-row")!;
    expect(firstRow.querySelector(".drafts-menu-thumbnail img")).toHaveAttribute("src", "https://api.dicebear.com/10.x/disco/svg?seed=first");
    expect(firstRow.querySelector(".drafts-menu-date")).not.toHaveTextContent(/:00/);
    expect(screen.queryByText("Body preview stays in the editor")).not.toBeInTheDocument();
    await user.click(firstRow.querySelector<HTMLButtonElement>(".drafts-menu-delete")!);
    expect(screen.queryByRole("button", { name: /First story/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Second story/ })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("create-memory-drafts") ?? "[]").map((draft: { id: string }) => draft.id)).toEqual(["second"]);
  });

  it("uses the topic identicon style for quick captures and drafts without media", async () => {
    const user = userEvent.setup();
    const key = "quick-capture-draft:anon:dp:prompt with spaces";
    localStorage.setItem(key, JSON.stringify({ note: "Quick note" }));
    localStorage.setItem("create-memory-drafts", JSON.stringify([
      { id: "draft with spaces", title: "Story draft", body: "", tags: [], attachments: [], updatedAt: "2026-10-14T13:01:00Z" },
    ]));
    renderWithProviders(<CreateMemory data={{}} isMobile={false} />);
    await user.click(screen.getByRole("button", { name: "Drafts" }));
    const quick = screen.getByRole("button", { name: /Quick note/ }).querySelector("img");
    const story = screen.getByRole("button", { name: /Story draft/ }).querySelector("img");
    expect(quick).toHaveAttribute("src", `https://api.dicebear.com/10.x/disco/svg?seed=${encodeURIComponent(key)}`);
    expect(story).toHaveAttribute("src", "https://api.dicebear.com/10.x/disco/svg?seed=draft%20with%20spaces");
    expect(quick).toHaveAttribute("referrerpolicy", "no-referrer");
  });

  it.each([0, 1, 3, 4, 5])("keeps %i drafts inside a scrolling region below the fixed header", async (count) => {
    const user = userEvent.setup();
    localStorage.setItem("create-memory-drafts", JSON.stringify(Array.from({ length: count }, (_, i) => ({
      id: `draft-${i}`, title: `Story ${i + 1}`, body: "", tags: [], attachments: [], updatedAt: "2026-10-14T13:01:00Z",
    }))));
    renderWithProviders(<CreateMemory data={{}} isMobile={false} />);
    await user.click(screen.getByRole("button", { name: "Drafts" }));
    const region = screen.getByRole("region", { name: "Saved drafts" });
    expect(region.querySelectorAll(".drafts-menu-row")).toHaveLength(count);
    expect(region).toHaveAttribute("tabindex", count > 4 ? "0" : "-1");
    const clear = screen.queryByRole("button", { name: "Clear all" });
    if (count > 0) expect(region).not.toContainElement(clear);
    else expect(region).toContainElement(screen.getByRole("heading", { name: "Draft is empty" }));
  });

  it("lets keyboard users tab through draft actions", async () => {
    const user = userEvent.setup();
    localStorage.setItem("create-memory-drafts", JSON.stringify([
      { id: "keyboard", title: "Keyboard draft", body: "", tags: [], attachments: [], updatedAt: "2026-10-14T13:01:00Z" },
    ]));
    renderWithProviders(<CreateMemory data={{}} isMobile={false} />);
    await user.click(screen.getByRole("button", { name: "Drafts" }));
    screen.getByRole("button", { name: "Clear all" }).focus();
    await user.tab();
    expect(screen.getByRole("button", { name: /Keyboard draft/ })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Delete" })).toHaveFocus();
  });

  it("opens an empty drafts panel and returns focus on Escape", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateMemory data={{}} isMobile={false} />, { auth: true });
    const trigger = screen.getByRole("button", { name: "Drafts" });
    await user.click(trigger);
    expect(screen.getByRole("heading", { name: "Draft is empty" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear all" })).not.toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("heading", { name: "Draft is empty" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("clears quick capture drafts even when there are no story drafts", async () => {
    const user = userEvent.setup();
    localStorage.setItem("quick-capture-draft:anon", JSON.stringify({ note: "Quick note" }));
    renderWithProviders(<CreateMemory data={{}} isMobile={false} />);
    await user.click(screen.getByRole("button", { name: "Drafts" }));
    await user.click(screen.getByRole("button", { name: "Clear all" }));
    expect(localStorage.getItem("quick-capture-draft:anon")).toBeNull();
    expect(screen.getByRole("heading", { name: "Draft is empty" })).toBeInTheDocument();
  });

  it("clears all displayed drafts without a pending autosave recreating them", async () => {
    const user = userEvent.setup();
    localStorage.setItem("create-memory-drafts", JSON.stringify([
      { id: "saved", title: "Saved draft", body: "", tags: [], attachments: [], updatedAt: new Date().toISOString() },
    ]));
    localStorage.setItem("quick-capture-draft:anon", JSON.stringify({ note: "Quick note" }));
    localStorage.setItem("quick-capture-draft:anon:dp:prompt", JSON.stringify({ note: "Daily note" }));
    localStorage.setItem("quick-capture-draft:someone-else", JSON.stringify({ note: "Keep this" }));
    renderWithProviders(<CreateMemory data={{}} isMobile={false} />);
    fireEvent.change(screen.getByPlaceholderText(/give this story a title/i), { target: { value: "Pending edit" } });
    await user.click(screen.getByRole("button", { name: "Drafts" }));
    await user.click(screen.getByRole("button", { name: "Clear all" }));
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 1100)); });
    expect(JSON.parse(localStorage.getItem("create-memory-drafts") ?? "[]")).toEqual([]);
    expect(localStorage.getItem("quick-capture-draft:anon")).toBeNull();
    expect(localStorage.getItem("quick-capture-draft:anon:dp:prompt")).toBeNull();
    expect(localStorage.getItem("quick-capture-draft:someone-else")).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Draft is empty" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/give this story a title/i)).toHaveValue("Pending edit");
    fireEvent.change(screen.getByPlaceholderText(/give this story a title/i), { target: { value: "New edit" } });
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 1100)); });
    expect(JSON.parse(localStorage.getItem("create-memory-drafts") ?? "[]")[0].title).toBe("New edit");
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

describe("CreateMemory hand-off and double saves", () => {
  const DRAFTS_KEY = "create-memory-drafts";
  function publishServer() {
    let calls = 0;
    server.use(
      http.post("http://localhost:3000/api/memories", async () => {
        calls += 1;
        await new Promise((resolve) => setTimeout(resolve, 30));
        return HttpResponse.json({ success: true, data: { _id: "story-1" } });
      }),
    );
    return () => calls;
  }
  const seeded = (onHandedOff = vi.fn()) => ({
    payload: { title: "A story", body: "<p>Hello</p>" },
    attachments: [{ file: { _id: "voice-1", name: "voice.webm", url: "https://x/voice.webm", size: 5, type: "audio/webm" }, duration: 3 }],
    onHandedOff,
  });

  it("publishes once, removes the autosaved draft and hands off", async () => {
    const calls = publishServer();
    const onHandedOff = vi.fn();
    localStorage.removeItem(DRAFTS_KEY);
    renderWithProviders(<CreateMemory data={seeded(onHandedOff)} />);
    await waitFor(() => expect(JSON.parse(localStorage.getItem(DRAFTS_KEY) ?? "[]")).toHaveLength(1), { timeout: 3000 });
    const publish = screen.getByRole("button", { name: "Publish Story" });
    fireEvent.click(publish);
    fireEvent.click(publish);
    await waitFor(() => expect(onHandedOff).toHaveBeenCalledWith("published"));
    expect(calls()).toBe(1);
    expect(onHandedOff).toHaveBeenCalledTimes(1);
    expect(JSON.parse(localStorage.getItem(DRAFTS_KEY) ?? "[]")).toHaveLength(0);
  });

  it("hands off as a draft when the composer closes with its story in Drafts", async () => {
    const onHandedOff = vi.fn();
    localStorage.removeItem(DRAFTS_KEY);
    const view = renderWithProviders(<CreateMemory data={seeded(onHandedOff)} />);
    await waitFor(() => expect(JSON.parse(localStorage.getItem(DRAFTS_KEY) ?? "[]")).toHaveLength(1), { timeout: 3000 });
    view.unmount();
    expect(onHandedOff).toHaveBeenCalledWith("draft");
  });

  it("does not hand off when nothing was saved, so the source keeps its copy", () => {
    const onHandedOff = vi.fn();
    localStorage.removeItem(DRAFTS_KEY);
    const view = renderWithProviders(<CreateMemory data={seeded(onHandedOff)} />);
    view.unmount();
    expect(onHandedOff).not.toHaveBeenCalled();
  });
});
