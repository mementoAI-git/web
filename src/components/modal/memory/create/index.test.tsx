import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { CreateMemory } from "./index";
import { renderWithProviders } from "@/test";
import type { IOnUploadPayload } from "@/utility/interface";

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
        return () => chainable();
      },
    });
  }
  const editorMock = {
    getHTML: editorGetHTMLMock,
    getText: editorGetTextMock,
    getAttributes: () => ({}),
    isActive: () => false,
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
    EditorContent: () => <div data-testid="mock-editor" tabIndex={-1} />,
  };
});

vi.mock("@emoji-mart/react", () => ({
  default: () => <div data-testid="emoji-mart-mock" />,
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

describe("CreateMemory", () => {
  beforeEach(() => {
    aiTaskRunMock.mockReset();
    editorSetContentMock.mockReset();
    editorGetHTMLMock.mockReset().mockReturnValue("");
    editorGetTextMock.mockReset().mockReturnValue("");
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
    expect(screen.getByPlaceholderText(/give this story a title/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publish Story" })).toBeInTheDocument();

    rerender(<CreateMemory data={{}} isMobile />);

    expect(screen.getByTestId("sheet-container")).toBeInTheDocument();
    expect(screen.queryByTestId("desktop-journal-shell")).not.toBeInTheDocument();
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

  it("shows the upload picker options from the composer toolbar", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateMemory data={{}} isMobile={false} />, { auth: true });

    await user.click(screen.getByLabelText(/add attachment/i));

    expect(screen.getByText("Choose upload type")).toBeInTheDocument();
    expect(screen.getAllByText("Photos").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Videos").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Audio").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Documents").length).toBeGreaterThan(0);
  });

  it("shows assistant content when the Assistant tab is selected", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateMemory data={{}} isMobile={false} />, { auth: true });

    const detailsTab = screen.getByRole("tab", { name: "Story Details" });
    const assistantTab = screen.getByRole("tab", { name: "Assistant" });
    expect(detailsTab).toHaveAttribute("aria-selected", "true");
    await user.click(assistantTab);

    expect(assistantTab).toHaveAttribute("data-state", "active");
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

  it("stacks the Story Details tabs above their scrollable panel", () => {
    renderWithProviders(<CreateMemory data={{}} isMobile={false} />, { auth: true });

    expect(screen.getByRole("tablist").closest('[data-slot="tabs"]')).toHaveClass("flex-col");
  });

  it("lets the active Assistant panel fill the available vertical space", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateMemory data={{}} isMobile={false} />, { auth: true });

    await user.click(screen.getByRole("tab", { name: "Assistant" }));
    const assistantPanel = screen.getByRole("tabpanel", { name: "Assistant" });
    expect(assistantPanel).toHaveClass("data-[state=active]:flex", "data-[state=active]:flex-col");
    expect(screen.queryByRole("tabpanel", { name: "Story Details" })).not.toBeInTheDocument();
  });

  it("reports a saved local draft only while the saved content matches the composer", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateMemory data={{}} isMobile={false} />, { auth: true });

    const titleInput = screen.getByPlaceholderText(/give this story a title/i);
    expect(screen.getByRole("status")).toHaveTextContent("Not saved");

    await user.type(titleInput, "A day to remember");
    await user.click(screen.getByRole("button", { name: "Save Draft" }));

    expect(screen.getByRole("status")).toHaveTextContent("Draft saved");
    expect(JSON.parse(localStorage.getItem("create-memory-drafts") ?? "[]")[0].title).toBe("A day to remember");

    await user.type(titleInput, " together");

    expect(screen.getByRole("status")).toHaveTextContent("Not saved");
  });

  it("marks a saved draft unsaved when only the body formatting changes", async () => {
    const user = userEvent.setup();
    editorGetTextMock.mockReturnValue("A warm afternoon");
    editorGetHTMLMock.mockReturnValue("<p>A warm afternoon</p>");
    const container = document.createElement("div");
    document.body.appendChild(container);
    const { rerender } = renderWithProviders(<CreateMemory data={{}} isMobile={false} />, { auth: true, container });

    await user.click(screen.getByRole("button", { name: "Save Draft" }));
    expect(screen.getByRole("status")).toHaveTextContent("Draft saved");
    expect(JSON.parse(localStorage.getItem("create-memory-drafts") ?? "[]")[0].body).toBe("<p>A warm afternoon</p>");

    editorGetHTMLMock.mockReturnValue("<p>A <strong>warm</strong> afternoon</p>");
    rerender(<CreateMemory data={{}} isMobile={false} />);

    expect(screen.getByRole("status")).toHaveTextContent("Not saved");
  });

  it("never reports saved while an upload is pending and compares only persisted attachments", async () => {
    const user = userEvent.setup();
    const uploadedFile = { _id: "photo-1", url: "/photo.jpg", name: "photo.jpg", size: 1024, type: "image/jpeg" };
    uploadState.files = [
      { id: "uploaded-client-id", file: null, progress: 100, uploadedFile },
      { id: "pending-upload", file: new File(["photo"], "pending.jpg", { type: "image/jpeg" }), progress: 25 },
    ];
    const container = document.createElement("div");
    document.body.appendChild(container);
    const { rerender } = renderWithProviders(<CreateMemory data={{}} isMobile={false} />, { auth: true, container });

    await user.click(screen.getByRole("button", { name: "Save Draft" }));

    expect(screen.getByRole("status")).toHaveTextContent("Not saved");
    expect(JSON.parse(localStorage.getItem("create-memory-drafts") ?? "[]")[0].attachments).toEqual([uploadedFile]);

    uploadState.files = [uploadState.files[0]];
    rerender(<CreateMemory data={{}} isMobile={false} />);

    expect(screen.getByRole("status")).toHaveTextContent("Draft saved");
  });

  it("invalidates saved status when all local drafts are cleared", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateMemory data={{}} isMobile={false} />, { auth: true });

    await user.click(screen.getByRole("button", { name: "Save Draft" }));
    expect(screen.getByRole("status")).toHaveTextContent("Draft saved");
    await user.click(screen.getByRole("button", { name: "Drafts" }));
    await user.click(screen.getByRole("button", { name: "Clear all" }));

    expect(screen.getByRole("status")).toHaveTextContent("Not saved");
    expect(JSON.parse(localStorage.getItem("create-memory-drafts") ?? "[]")).toEqual([]);
  });

  it("invalidates saved status when the manually saved draft is deleted", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateMemory data={{}} isMobile={false} />, { auth: true });

    await user.click(screen.getByRole("button", { name: "Save Draft" }));
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
