import { useRef, useState } from "react";
import { useModal } from "@/hooks/use-modal";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { deleteMemory, restoreMemory, MEMORY_UNDO_DURATION, memoryActionError } from "@/api/memory-lifecycle";
import { DeletePromptModal } from "../delete-prompt-modal";

interface DeleteMemoryProps {
  data: { memory: { _id: string; status?: string } };
}

export function DeleteMemory({ data: { memory } }: DeleteMemoryProps) {
  const { close } = useModal();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const pending = useRef(false);
  const permanently = memory.status === "deleted";

  const handleDelete = async () => {
    if (pending.current) return;
    pending.current = true;
    setSubmitting(true);
    try {
      await deleteMemory(memory._id, permanently);
      if (location.pathname.includes(memory._id)) navigate("/stories");
      close("delete-memory");
      if (permanently) {
        toast.dismiss(`memory-deleted:${memory._id}`);
        toast.success("Memory permanently deleted");
      } else {
        let undoing = false;
        toast.success("Memory moved to Deleted", {
          id: `memory-deleted:${memory._id}`,
          duration: MEMORY_UNDO_DURATION,
          description: "You can restore it for 30 days.",
          action: {
            label: "Undo",
            onClick: () => {
              if (undoing) return;
              undoing = true;
              void restoreMemory(memory._id).then(
                () => toast.success("Memory restored"),
                (error) => toast.error(memoryActionError(error, "Couldn't undo deletion. Restore it from Deleted.")),
              ).finally(() => { undoing = false; });
            },
          },
        });
      }
    } catch (error) {
      toast.error(memoryActionError(error, "Couldn't delete this memory. Please try again."));
    } finally {
      pending.current = false;
      setSubmitting(false);
    }
  };

  return (
    <DeletePromptModal
      onClose={() => { if (!pending.current) close("delete-memory"); }}
      title={permanently ? "Delete memory permanently?" : "Move memory to Deleted?"}
      description={permanently ? "This memory and its unshared attachments will be permanently removed. This cannot be undone." : "This memory will leave your stories. You can restore it from Deleted for 30 days before it is permanently removed."}
      confirmLabel={permanently ? "Delete permanently" : "Move to Deleted"}
      onConfirm={() => void handleDelete()}
      loading={submitting}
    />
  );
}
