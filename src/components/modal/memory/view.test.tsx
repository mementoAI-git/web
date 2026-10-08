import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import type { Editor } from "@tiptap/core";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test";
import { server } from "@/test/mocks/server";
import type { IMemory, IOnUploadPayload } from "@/utility/interface";
import Modal from "@/components/modal";
import { useModal } from "@/hooks/use-modal";
import { ViewMemory } from "./view";
import calendarIcon from "@/assets/icon/uim_calendar.svg";

vi.mock("./recorder-modal", () => ({
  AudioRecorderModal: ({ data }: { data: { onFinish: (file: File, duration: number) => void } }) => {
    const { close } = useModal();
    return <button onClick={() => {
      data.onFinish(new File(["voice"], "voice.webm", { type: "audio/webm" }), 12);
      close?.("audio-recorder");
    }}>Finish voice recording</button>;
  },
  VideoRecorderModal: ({ data }: { data: { onFinish: (file: File) => void } }) => {
    const { close } = useModal();
    return <button onClick={() => {
      data.onFinish(new File(["video"], "video.webm", { type: "video/webm" }));
      close?.("video-recorder");
    }}>Finish video recording</button>;
  },
}));

vi.mock("./create/file-thumbnails", () => ({
  FileThumbnails: ({ files, onRemove }: { files: IOnUploadPayload[]; onRemove: (id: string) => void }) => <div data-testid="file-thumbnails">
    {files.map((file) => <button key={file.id} onClick={() => onRemove(file.id)}>Remove {file.uploadedFile?.name}</button>)}
  </div>,
}));

const story = {
  _id: "memory-1",
  title: "Sunday dinner",
  body: "<p>At home with everyone.</p>",
  user: "mock-user",
  attachments: [],
  tags: ["family"],
  type: "story",
  status: "active",
  level: 0,
  refrence: "",
  last_opened: "2026-09-20T12:00:00.000Z",
  created_at: "2026-09-20T12:00:00.000Z",
  updated_at: "2026-09-20T12:00:00.000Z",
  visibility: "private",
  groups: [],
  beneficiaries: [],
} satisfies IMemory;

const createRange = document.createRange.bind(document);

function renderStory() {
  return renderWithProviders(
    <ViewMemory
      data={{ memoryId: story._id, memory: story }}
      isMobile={false}
    />,
    { auth: true },
  );
}

function StoryModalHarness() {
  const { open } = useModal();
  return (
    <>
      <button
        type="button"
        onClick={() => open?.("view-memory", { memory: story })}
      >
        Open story
      </button>
      <Modal />
    </>
  );
}

describe("ViewMemory", () => {
  it("shows the Add Story calendar and media controls when editing", async () => {
    const user = userEvent.setup();
    renderStory();
    await user.click(screen.getByRole("button", { name: "Edit story" }));
    const date = screen.getByText("Sep 20, 2026");
    expect(date.parentElement?.querySelector("img")).toHaveAttribute("src", calendarIcon);
    expect(screen.getByRole("button", { name: "Record audio" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Record video" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Insert emoji" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add attachment" }));
    for (const name of ["Photos", "Videos", "Audio", "Documents"]) {
      expect(screen.getByRole("menuitem", { name })).toBeInTheDocument();
    }
    await user.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
  });

  it("uploads an edit attachment and saves its ID with the story", async () => {
    let saved: unknown;
    server.use(http.put("http://localhost:3000/api/memories/memory-1", async ({ request }) => {
      saved = await request.json();
      return HttpResponse.json({ success: true, data: story });
    }));
    const user = userEvent.setup();
    renderStory();
    await user.click(screen.getByRole("button", { name: "Edit story" }));
    await user.upload(screen.getByLabelText("Upload photos"), new File(["image"], "photo.png", { type: "image/png" }));
    await screen.findByRole("button", { name: "Remove mock-upload.png" });
    await waitFor(() => expect(screen.getByRole("button", { name: "Save changes" })).toBeEnabled());
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    await screen.findByRole("button", { name: "Edit story" });
    expect(saved).toEqual({ attachments: ["mock-file-id"] });
  });

  it.each([
    ["Record audio", "Finish voice recording", "voice.webm", "audio/webm", "12"],
    ["Record video", "Finish video recording", "video.webm", "video/webm", null],
  ])("adds a recording using %s and keeps editing after the recorder closes", async (control, finish, name, type, duration) => {
    let saved: unknown;
    let uploadedDuration: FormDataEntryValue | null = null;
    server.use(
      http.post("http://localhost:3000/api/files/upload", async ({ request }) => {
        const form = await request.formData();
        uploadedDuration = form.get("duration");
        expect((form.get("file") as File).type).toBe(type);
        return HttpResponse.json({ success: true, data: { _id: "recording-id", name, type, size: 5, url: "https://example.com/recording.webm" } });
      }),
      http.put("http://localhost:3000/api/memories/memory-1", async ({ request }) => {
        saved = await request.json();
        return HttpResponse.json({ success: true, data: story });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<StoryModalHarness />, { auth: true });
    await user.click(screen.getByRole("button", { name: "Open story" }));
    await user.click(screen.getByRole("button", { name: "Edit story" }));
    await user.click(screen.getByRole("button", { name: control }));
    await user.click(await screen.findByRole("button", { name: finish }));
    await screen.findByRole("button", { name: `Remove ${name}` });
    expect(uploadedDuration).toBe(duration);
    expect(screen.getByRole("textbox", { name: "Story title" })).toHaveValue(story.title);
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    await screen.findByRole("button", { name: "Edit story" });
    expect(saved).toEqual({ attachments: ["recording-id"] });
  });

  it("blocks saving while an attachment uploads and allows discarding it", async () => {
    let finishUpload!: () => void;
    const pendingUpload = new Promise<void>((resolve) => { finishUpload = resolve; });
    server.use(http.post("http://localhost:3000/api/files/upload", async () => {
      await pendingUpload;
      return HttpResponse.json({ success: true, data: { _id: "late-file", name: "photo.png", type: "image/png", size: 5, url: "https://example.com/photo.png" } });
    }));
    const user = userEvent.setup();
    renderStory();
    await user.click(screen.getByRole("button", { name: "Edit story" }));
    await user.upload(screen.getByLabelText("Upload photos"), new File(["image"], "photo.png", { type: "image/png" }));
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Cancel editing" }));
    await user.click(screen.getByRole("button", { name: "Discard changes" }));
    await user.click(screen.getByRole("button", { name: "Edit story" }));
    finishUpload();
    await waitFor(() => expect(screen.queryByRole("button", { name: "Remove photo.png" })).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
  });

  it("closes the recorder with Escape and preserves the edit draft", async () => {
    const user = userEvent.setup();
    renderWithProviders(<StoryModalHarness />, { auth: true });
    await user.click(screen.getByRole("button", { name: "Open story" }));
    await user.click(screen.getByRole("button", { name: "Edit story" }));
    await user.type(screen.getByRole("textbox", { name: "Story title" }), " together");
    await user.click(screen.getByRole("button", { name: "Record audio" }));
    expect(screen.getByRole("button", { name: "Finish voice recording" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("button", { name: "Finish voice recording" })).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Story title" })).toHaveValue("Sunday dinner together");
    expect(screen.queryByRole("dialog", { name: "Discard unsaved changes?" })).not.toBeInTheDocument();
  });

  beforeEach(() => {
    // ProseMirror needs selection geometry, which JSDOM does not implement.
    vi.spyOn(document, "createRange").mockImplementation(() => {
      const range = createRange();
      range.getClientRects = () => [] as unknown as DOMRectList;
      range.getBoundingClientRect = () => new DOMRect(0, 0, 0, 0);
      return range;
    });
    server.use(
      http.get("http://localhost:3000/api/memories/memory-1", () =>
        HttpResponse.json({ success: true, data: story }),
      ),
    );
  });
  afterEach(() => vi.restoreAllMocks());

  it("refreshes a pending quick note to show its completed title and tags", async () => {
    let complete = false;
    let reads = 0;
    server.use(http.get("http://localhost:3000/api/memories/memory-1", () => {
      reads += 1;
      return HttpResponse.json({ success: true, data: {
        ...story,
        title: complete ? "Sunday dinner" : "Thought",
        tags: complete ? ["family"] : [],
        capture_source: "quick",
        enrichment_status: complete ? "complete" : "pending",
      } });
    }));
    renderWithProviders(<ViewMemory data={{ memoryId: story._id }} />, { auth: true });
    expect(await screen.findByRole("heading", { name: "Thought" })).toBeInTheDocument();
    complete = true;
    expect(await screen.findByRole("heading", { name: "Sunday dinner" }, { timeout: 6000 })).toBeInTheDocument();
    expect(screen.getByText("#family")).toBeInTheDocument();
    expect(reads).toBeGreaterThan(1);
  });

  it("opens a story in the centered overlay in read-only mode", async () => {
    renderStory();

    expect(screen.getByTestId("desktop-journal-shell")).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "View Story" })).toHaveAttribute("data-story-presentation", "overlay-b");
    expect(screen.queryByTestId("desktop-story-environment")).not.toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "Sunday dinner" }),
    ).toBeInTheDocument();
    expect(screen.getByText("At home with everyone.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sunday dinner" }).closest("section")).toHaveClass("pl-4");
    expect(
      screen.getByRole("button", { name: "Edit story" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Save changes" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: "Story title" }),
    ).not.toBeInTheDocument();
  });

  it("opens Details and restores focus after collapsing the panel", async () => {
    const user = userEvent.setup();
    renderStory();
    const details = screen.getByRole("button", { name: "Details" });
    expect(details).toHaveAttribute("aria-expanded", "false");
    await user.click(details);
    expect(details).toHaveAttribute("aria-expanded", "true");
    const collapse = screen.getByRole("button", { name: "Collapse story details" });
    await user.click(collapse);
    expect(details).toHaveAttribute("aria-expanded", "false");
    expect(details).toHaveFocus();
  });

  it("closes the view overlay with Escape", async () => {
    const user = userEvent.setup();
    renderWithProviders(<StoryModalHarness />, { auth: true });
    await user.click(screen.getByRole("button", { name: "Open story" }));
    expect(screen.getByRole("dialog", { name: "View Story" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "View Story" })).not.toBeInTheDocument();
  });

  it("switches the same journal into editing mode and discards changes", async () => {
    const user = userEvent.setup();
    renderStory();
    const shell = screen.getByTestId("desktop-journal-shell");

    await user.click(await screen.findByRole("button", { name: "Edit story" }));
    expect(screen.getByTestId("desktop-journal-shell")).toBe(shell);

    const title = screen.getByRole("textbox", { name: "Story title" });
    await user.clear(title);
    await user.type(title, "Changed locally");
    await user.click(screen.getByRole("button", { name: "Cancel editing" }));
    expect(
      screen.getByRole("dialog", { name: "Discard story changes?" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Discard story changes?" })).toHaveClass("z-[310]");
    await user.click(screen.getByRole("button", { name: "Discard changes" }));

    expect(
      screen.getByRole("heading", { name: "Sunday dinner" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByDisplayValue("Changed locally"),
    ).not.toBeInTheDocument();
  });

  it("saves edits and returns the journal to read-only mode", async () => {
    let updateBody: Record<string, unknown> | undefined;
    server.use(
      http.put(
        "http://localhost:3000/api/memories/memory-1",
        async ({ request }) => {
          updateBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({
            success: true,
            data: { ...story, ...updateBody },
          });
        },
      ),
    );
    const user = userEvent.setup();
    renderStory();

    await user.click(await screen.findByRole("button", { name: "Edit story" }));
    const title = screen.getByRole("textbox", { name: "Story title" });
    await user.clear(title);
    await user.type(title, "Updated title");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(
      await screen.findByRole("heading", { name: "Updated title" }),
    ).toBeInTheDocument();
    expect(updateBody).toMatchObject({ title: "Updated title" });
    expect(
      screen.queryByRole("button", { name: "Save changes" }),
    ).not.toBeInTheDocument();
  });

  it("keeps the working copy when saving fails", async () => {
    server.use(
      http.put("http://localhost:3000/api/memories/memory-1", () =>
        HttpResponse.json(
          { success: false, message: "Could not save your story." },
          { status: 500 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderStory();

    await user.click(await screen.findByRole("button", { name: "Edit story" }));
    const title = screen.getByRole("textbox", { name: "Story title" });
    await user.clear(title);
    await user.type(title, "Unsaved title");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(
      await screen.findByDisplayValue("Unsaved title"),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("button", { name: "Save changes" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel editing" }));
    await user.click(screen.getByRole("button", { name: "Discard changes" }));
    expect(screen.getByRole("button", { name: "Edit story" })).toBeInTheDocument();
  });

  it("protects unsaved edits before closing the story", async () => {
    const user = userEvent.setup();
    renderWithProviders(<StoryModalHarness />, { auth: true });

    await user.click(screen.getByRole("button", { name: "Open story" }));
    await user.click(await screen.findByRole("button", { name: "Edit story" }));
    await user.type(
      screen.getByRole("textbox", { name: "Story title" }),
      " changed",
    );
    await user.click(screen.getByRole("button", { name: "Close story" }));

    expect(
      screen.getByRole("dialog", { name: "Discard story changes?" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(screen.getByRole("textbox", { name: "Story title" })).toHaveValue("Sunday dinner changed");
    await user.click(screen.getByRole("button", { name: "Close story" }));
    await user.click(screen.getByRole("button", { name: "Discard changes" }));
    expect(screen.queryByRole("dialog", { name: "View Story" })).not.toBeInTheDocument();
  });

  it("does not mark an unchanged plain-text story as edited", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ViewMemory data={{ memory: { ...story, body: "At home with everyone." } }} />, { auth: true });
    await user.click(screen.getByRole("button", { name: "Edit story" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled());
    await user.click(screen.getByRole("button", { name: "Cancel editing" }));
    expect(screen.queryByRole("dialog", { name: "Discard story changes?" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit story" })).toBeInTheDocument();
  });

  it("keeps a wrapped edit title visible after resizing", async () => {
    const user = userEvent.setup();
    renderStory();
    await user.click(screen.getByRole("button", { name: "Edit story" }));
    const title = screen.getByRole("textbox", { name: "Story title" });
    Object.defineProperty(title, "scrollHeight", { configurable: true, value: 144 });
    fireEvent(window, new Event("resize"));
    expect(title).toHaveStyle({ height: "144px" });
  });

  it("saves changes made in the body editor", async () => {
    let savedBody = "";
    server.use(http.put("http://localhost:3000/api/memories/memory-1", async ({ request }) => {
      savedBody = ((await request.json()) as { body: string }).body;
      return HttpResponse.json({ success: true, data: { ...story, body: savedBody } });
    }));
    const user = userEvent.setup();
    const { baseElement } = renderStory();
    await user.click(screen.getByRole("button", { name: "Edit story" }));
    const body = baseElement.querySelector('[contenteditable="true"]');
    expect(body).not.toBeNull();
    // Drive the real editor transaction; JSDOM has no selection geometry for typing.
    act(() => (body as HTMLElement & { editor: Editor }).editor.commands.setContent("<p>A changed story.</p>"));
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByRole("button", { name: "Edit story" })).toBeInTheDocument();
    expect(screen.getByText("A changed story.")).toBeInTheDocument();
    expect(savedBody).toContain("A changed story.");
    expect(screen.getByRole("button", { name: "Edit story" })).toBeInTheDocument();
  });

  it("saves attachment removal through the supported endpoint instead of an invalid update payload", async () => {
    const withFile = { ...story, attachments: [{ _id: "file-1", name: "photo.jpg", url: "/photo.jpg", size: 12, type: "image/jpeg" }] };
    let removed = false;
    server.use(
      http.get("http://localhost:3000/api/memories/memory-1", () => HttpResponse.json({ success: true, data: withFile })),
      http.delete("http://localhost:3000/api/memories/remove-file/file-1", () => {
        removed = true;
        return HttpResponse.json({ success: true });
      }),
      http.put("http://localhost:3000/api/memories/memory-1", async ({ request }) => {
        const payload = await request.json() as Record<string, unknown>;
        if ("removeAttachments" in payload) return HttpResponse.json({ success: false }, { status: 400 });
        return HttpResponse.json({ success: true });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<ViewMemory data={{ memory: withFile }} />, { auth: true });
    await user.click(screen.getByRole("button", { name: "Edit story" }));
    await user.click(screen.getByRole("button", { name: "Remove photo.jpg" }));
    expect(removed).toBe(false);
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByRole("button", { name: "Edit story" })).toBeInTheDocument();
    expect(removed).toBe(true);
  });

  it("dismisses the edit link control with Escape before closing the story", async () => {
    const user = userEvent.setup();
    renderWithProviders(<StoryModalHarness />, { auth: true });
    await user.click(screen.getByRole("button", { name: "Open story" }));
    await user.click(screen.getByRole("button", { name: "Edit story" }));
    await user.click(screen.getByRole("button", { name: "Link" }));
    expect(screen.getByPlaceholderText("Enter URL...")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByPlaceholderText("Enter URL...")).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "View Story" })).toBeInTheDocument();
  });
});
