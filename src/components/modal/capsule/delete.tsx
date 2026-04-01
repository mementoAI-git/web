import endpoint from "@/api/endpoint";
import useFetcher from "@/hooks/use-fetcher";
import { useModal } from "@/hooks/use-modal";
import { resolvePath } from "@/utility";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { mutate } from "swr";
import { DeletePromptModal } from "../delete-prompt-modal";

interface DeleteCapsuleProps {
  data: string;
}

export function DeleteCapsule({ data: id }: DeleteCapsuleProps) {
  const { close } = useModal();
  const navigate = useNavigate();
  const { trigger, isMutating } = useFetcher(
    resolvePath(endpoint.capsuleDelete, { id }),
    "delete",
  );

  const handleDelete = async () => {
    const result = await trigger({});
    if (result?.success) {
      await mutate(
        (key) => typeof key === "string" && key.startsWith(endpoint.capsule),
      );
      await mutate(endpoint.capsuleStats);

      toast.success(result.message);
    }
    close?.("delete-capsule");
    navigate("capsule");
  };

  return (
    <DeletePromptModal
      onClose={() => close?.("delete-capsule")}
      title="Delete capsule"
      description="Are you sure you want to delete this post? This action cannot be undone."
      confirmLabel="Yes, Delete"
      onConfirm={handleDelete}
      loading={isMutating}
    />
  );
}
