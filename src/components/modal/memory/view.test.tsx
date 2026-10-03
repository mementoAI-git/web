import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test";
import { server } from "@/test/mocks/server";
import type { IMemory } from "@/utility/interface";
import Modal from "@/components/modal";
import { useModal } from "@/hooks/use-modal";
import { ViewMemory } from "./view";

vi.mock("./create/file-thumbnails", () => ({
  FileThumbnails: () => <div data-testid="file-thumbnails" />,
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
  beforeEach(() => {
    server.use(
      http.get("http://localhost:3000/api/memories/memory-1", () =>
        HttpResponse.json({ success: true, data: story }),
      ),
    );
  });

  it("opens a story in the shared journal in read-only mode", async () => {
    renderStory();

    expect(screen.getByTestId("desktop-journal-shell")).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "Sunday dinner" }),
    ).toBeInTheDocument();
    expect(screen.getByText("At home with everyone.")).toBeInTheDocument();
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
      screen.getByRole("button", { name: "Save changes" }),
    ).toBeInTheDocument();
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
  });
});
