import AddFileButton from "@/components/add-file-button";
import Spinner from "@/components/spinner";

interface FooterBtnGroupProps {
  disabled?: boolean;
  onDiscard: () => void;
  onSave: () => void;
  onAddFileBtnClick: () => void;
  saving?: boolean;
  editMode?: boolean;
}

export const inputTypes = { text: "text", video: "video", audio: "audio" } as const;

export function FooterBtnGroup({
  onDiscard,
  onSave,
  onAddFileBtnClick,
  saving = false,
  editMode = false,
  disabled = false,
}: FooterBtnGroupProps) {
  return (
    <div className={`mt-2 flex items-center justify-between ${disabled ? "cursor-not-allowed opacity-40" : ""}`}>
      <AddFileButton disabled={disabled} onClick={onAddFileBtnClick} />
      {editMode ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={onDiscard}
            className="btn-outline border-[#C7C9C8]!"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={onSave}
            className="btn flex items-center gap-2"
          >
            Continue
            <Spinner loading={saving} className="size-4!" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={onDiscard}
            className="btn-outline border-[#C7C9C8]!"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={onSave}
            className="btn flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue
            <Spinner loading={saving} className="size-4!" />
          </button>
        </div>
      )}
    </div>
  );
}
