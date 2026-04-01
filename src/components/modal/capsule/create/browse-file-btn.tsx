import { useCallback, type ChangeEvent } from "react";
import { v4 as uuidv4 } from "uuid";
import type { IOnUploadPayload } from "@/utility/interface";
import { CAPSULE_SUPPORTED_FILE_TYPES } from "@/utility/constant";
import { cn } from "@/utility";
import { toast } from "sonner";

interface AttachFileBtnProps {
  onUpload: (payload: IOnUploadPayload) => void;
}

export default function BrowseFileBtn({ onUpload }: AttachFileBtnProps) {
  const handleUpload = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const MAX_FILE_SIZE = 120 * 1024 * 1024;

      if (file.size > MAX_FILE_SIZE) {
        toast.error("File size exceeds 120MB limit");
        return;
      }

      onUpload({ id: uuidv4(), file, progress: 0 });
    },
    [onUpload],
  );

  return (
    <label className="flex cursor-pointer items-center justify-center rounded-full border border-v3-stroke-weak text-secondary">
      <input
        accept={CAPSULE_SUPPORTED_FILE_TYPES.join(",")}
        id="attachment"
        type="file"
        hidden
        onChange={handleUpload}
      />
      {/* Change button to span or div */}
      <span
        className={cn(
          "btn",
          "bg-transparent! text-sm shadow-none! text-strong! border border-black/20!",
        )}
      >
        Browse files
      </span>
    </label>
  );
}
