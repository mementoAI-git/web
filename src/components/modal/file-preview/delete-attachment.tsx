import { DeletePromptModal } from "../delete-prompt-modal";

interface DeleteMemoryAttachmentProps {
  loading?: boolean;
  open?: boolean;
  close: () => void;
  onDelete: () => void;
}

export default function DeleteMemoryAttachment({
  loading = false,
  open = false,
  close,
  onDelete,
}: DeleteMemoryAttachmentProps) {
  return (
    <div className={`modal-overlay z-[100] bg-overlay-backdrop ${open ? "flex" : "hidden"}`}>
      <DeletePromptModal
        onClose={close}
        title="Delete memory"
        description="Are you sure you want to delete this post? This action cannot be undone."
        confirmLabel="Yes, Delete"
        onConfirm={onDelete}
        loading={loading}
      />
    </div>
  );
}
