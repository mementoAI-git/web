import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { IMemory } from "@/utility/interface";
import { toast } from "sonner";
import { restoreMemory } from "@/api/memory-lifecycle";
import { MemoryItemActions } from "./dropdown";

vi.mock("@/hooks/use-modal", () => ({
  useModal: () => ({ open: vi.fn() }),
}));

vi.mock("@/hooks/use-bookmark", () => ({
  useBookmark: () => ({ toggleBookmark: vi.fn() }),
}));

vi.mock("@/api/memory-lifecycle", () => ({ restoreMemory: vi.fn(), memoryActionError: (error: Error) => error.message }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), dismiss: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());

const memory = {
  _id: "memory-1",
  title: "A story",
  body: "Story body",
  user: "user-1",
  attachments: [],
  tags: [],
  type: "story",
  status: "published",
  level: 0,
  refrence: "",
  last_opened: "2026-09-23T00:00:00.000Z",
  created_at: "2026-09-23T00:00:00.000Z",
  updated_at: "2026-09-23T00:00:00.000Z",
} satisfies IMemory;

describe("MemoryItemActions", () => {
  it("uses the canonical shadcn dropdown menu composition", async () => {
    const user = userEvent.setup();
    render(<MemoryItemActions memory={memory} />);

    const trigger = screen.getByRole("button", { name: "Story actions" });
    expect(trigger).toHaveAttribute("data-variant", "outline");
    expect(trigger).toHaveAttribute("data-size", "icon-sm");

    await user.click(trigger);

    const editItem = screen.getByRole("menuitem", { name: "Edit story" });
    const deleteItem = screen.getByRole("menuitem", { name: "Delete" });
    const content = editItem.closest('[data-slot="dropdown-menu-content"]');

    expect(
      editItem.closest('[data-slot="dropdown-menu-group"]'),
    ).toBeInTheDocument();
    expect(
      deleteItem.closest('[data-slot="dropdown-menu-group"]'),
    ).toBeInTheDocument();
    expect(deleteItem).toHaveAttribute("data-variant", "destructive");
    expect(content).toHaveClass("rounded-2xl", "shadow-2xl", "navigation-menu");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(content).not.toHaveClass("w-32", "rounded-lg", "p-0.5");
  });

  it("supports a quiet horizontal trigger for card captions", () => {
    render(<MemoryItemActions memory={memory} trigger="horizontal" />);

    const trigger = screen.getByRole("button", { name: "Story actions" });

    expect(trigger).toHaveAttribute("data-variant", "ghost");
    expect(trigger.querySelector(".lucide-ellipsis")).toBeInTheDocument();
  });
  it("restores through the shared lifecycle and only reports confirmed success", async () => {
    vi.mocked(restoreMemory).mockResolvedValueOnce(memory);
    const user = userEvent.setup();
    render(<MemoryItemActions memory={{ ...memory, status: "deleted", delete_after: "2099-01-01T00:00:00Z" }} />);
    await user.click(screen.getByRole("button", { name: "Story actions" }));
    expect(screen.getByRole("menuitem", { name: "Delete permanently" })).toBeInTheDocument();
    await user.click(screen.getByRole("menuitem", { name: "Restore" }));
    expect(restoreMemory).toHaveBeenCalledWith(memory._id);
    expect(toast.success).toHaveBeenCalledWith("Memory restored");
  });
  it("shows restore failures as a toast without a false success", async () => {
    vi.mocked(restoreMemory).mockRejectedValueOnce(new Error("Restore failed"));
    const user = userEvent.setup();
    render(<MemoryItemActions memory={{ ...memory, status: "deleted" }} />);
    await user.click(screen.getByRole("button", { name: "Story actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Restore" }));
    expect(toast.error).toHaveBeenCalledWith("Restore failed");
    expect(toast.success).not.toHaveBeenCalled();
  });
  it("disables Restore when the recovery deadline has passed", async () => {
    const user = userEvent.setup();
    render(<MemoryItemActions memory={{ ...memory, status: "deleted", delete_after: "2000-01-01T00:00:00Z" }} />);
    await user.click(screen.getByRole("button", { name: "Story actions" }));
    expect(screen.getByRole("menuitem", { name: "Restore" })).toHaveAttribute("aria-disabled", "true");
  });

});
