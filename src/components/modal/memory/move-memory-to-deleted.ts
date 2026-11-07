import { toast } from "sonner";
import {
  deleteMemory,
  MEMORY_UNDO_DURATION,
  memoryActionError,
  restoreMemory,
} from "@/api/memory-lifecycle";

/** Moves a story to Deleted and offers the same undo everywhere it can be deleted from. */
export async function moveMemoryToDeleted(memoryId: string) {
  await deleteMemory(memoryId, false);
  let undoing = false;
  toast.success("Memory moved to Deleted", {
    id: `memory-deleted:${memoryId}`,
    duration: MEMORY_UNDO_DURATION,
    description: "You can restore it for 30 days.",
    action: {
      label: "Undo",
      onClick: () => {
        if (undoing) return;
        undoing = true;
        void restoreMemory(memoryId)
          .then(
            () => toast.success("Memory restored"),
            (error) =>
              toast.error(
                memoryActionError(error, "Couldn't undo deletion. Restore it from Deleted."),
              ),
          )
          .finally(() => {
            undoing = false;
          });
      },
    },
  });
}
