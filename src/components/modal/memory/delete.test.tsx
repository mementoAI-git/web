import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { deleteMemory, restoreMemory } from "@/api/memory-lifecycle";
import { DeleteMemory } from "./delete";
const { close } = vi.hoisted(() => ({ close: vi.fn() }));
vi.mock("@/hooks/use-modal", () => ({ useModal: () => ({ close }) }));
vi.mock("@/api/memory-lifecycle", () => ({ deleteMemory: vi.fn(), restoreMemory: vi.fn(), MEMORY_UNDO_DURATION: 10_000, memoryActionError: (error: Error) => error.message }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), dismiss: vi.fn() } }));
function mount(status = "save") { return render(<MemoryRouter><DeleteMemory data={{ memory: { _id: "memory-1", status } }} /></MemoryRouter>); }
beforeEach(() => { vi.clearAllMocks(); vi.mocked(deleteMemory).mockResolvedValue({ _id: "memory-1" } as never); vi.mocked(restoreMemory).mockResolvedValue({ _id: "memory-1", status: "save" } as never); });
describe("Delete memory", () => {
  it("provides a ten-second Undo action that survives closing the dialog", async () => {
    const user = userEvent.setup(); const view = mount();
    await user.click(screen.getByRole("button", { name: "Move to Deleted" }));
    expect(deleteMemory).toHaveBeenCalledWith("memory-1", false);
    expect(close).toHaveBeenCalledWith("delete-memory");
    expect(toast.success).toHaveBeenCalledWith("Memory moved to Deleted", expect.objectContaining({ duration: 10_000, action: expect.objectContaining({ label: "Undo" }) }));
    const options = vi.mocked(toast.success).mock.calls[0][1];
    view.unmount();
    const undo = options?.action as { onClick: () => void };
    undo.onClick();
    await waitFor(() => expect(restoreMemory).toHaveBeenCalledWith("memory-1"));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Memory restored"));
  });
  it("keeps failures in a toast and leaves the dialog available to retry", async () => {
    vi.mocked(deleteMemory).mockRejectedValueOnce(new Error("Couldn't connect"));
    const user = userEvent.setup(); mount();
    await user.click(screen.getByRole("button", { name: "Move to Deleted" }));
    expect(toast.error).toHaveBeenCalledWith("Couldn't connect");
    expect(close).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Move to Deleted" })).toBeEnabled();
  });
  it("shows a distinct irreversible confirmation and no Undo for permanent deletion", async () => {
    const user = userEvent.setup(); mount("deleted");
    expect(screen.getByText(/This cannot be undone/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete permanently" }));
    expect(deleteMemory).toHaveBeenCalledWith("memory-1", true);
    expect(toast.success).toHaveBeenCalledWith("Memory permanently deleted");
  });
  it("reports an Undo failure without claiming restoration succeeded", async () => {
    vi.mocked(restoreMemory).mockRejectedValueOnce(new Error("Recovery unavailable"));
    const user = userEvent.setup(); mount();
    await user.click(screen.getByRole("button", { name: "Move to Deleted" }));
    const action = vi.mocked(toast.success).mock.calls[0][1]?.action as { onClick: () => void };
    action.onClick();
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Recovery unavailable"));
    expect(toast.success).not.toHaveBeenCalledWith("Memory restored");
  });
});
