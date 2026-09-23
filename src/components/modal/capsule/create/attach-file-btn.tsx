import { useCallback, type ChangeEvent } from "react";
import { v4 as uuidv4 } from "uuid";
import { ClipIcon } from "@/components/icons";
import type { IOnUploadPayload } from "@/utility/interface";
import { SUPPORTED_FILE_TYPES } from "@/utility/constant";

interface AttachFileBtnProps {
  onUpload: (payload: IOnUploadPayload) => void;
}

export default function AttachFileBtn({ onUpload }: AttachFileBtnProps) {
  const handleUpload = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      onUpload({ id: uuidv4(), file, progress: 0 });
    },
    [onUpload],
  );

  return (
    <label className="flex size-10 cursor-pointer items-center justify-center rounded-full border border-[#EAECF0] text-foreground">
      <input accept={SUPPORTED_FILE_TYPES.join(",")} id="attachment" type="file" hidden onChange={handleUpload} />
      <ClipIcon width={16} height={16} />
    </label>
  );
}
