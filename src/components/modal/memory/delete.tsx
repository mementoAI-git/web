import { useState } from "react";
import endpoint from "@/api/endpoint";
import { useModal } from "@/hooks/use-modal";
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation } from "@/hooks/use-api";
import { DeletePromptModal } from "../delete-prompt-modal";

interface DeleteMemoryProps {
  data: { memory: { _id: string; status?: string } };
}

export function DeleteMemory({ data: { memory } }: DeleteMemoryProps) {
  const { close } = useModal();
  const navigate = useNavigate();
  const location = useLocation();
  const { trigger, isLoading } = useMutation(endpoint.memory, {
    method: "DELETE",
    invalidate: [endpoint.stories, endpoint.memories, endpoint.conversations],
  });
  const [submitting, setSubmitting] = useState(false);

  const handleDelete = async () => {
    if (submitting) return;
    setSubmitting(true);

    const result = await trigger(
      { delete_permanently: memory?.status === "deleted" },
      { id: memory._id },
    );

    if (result?.data) {
      if (location.pathname.includes(memory._id)) {
        navigate("/memories");
      }
      close("delete-memory");
    }
    setSubmitting(false);
  };

  return (
    <DeletePromptModal
      onClose={() => close("delete-memory")}
      title="Delete memory"
      description="Are you sure you want to delete this post? This action cannot be undone."
      confirmLabel="Yes, Delete"
      onConfirm={handleDelete}
      loading={isLoading || submitting}
    />
  );
}
