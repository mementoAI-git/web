import Spinner from "../Spinner";
import AddFileButton from "../AddFileButton";

interface IFooterBtnGroup {
  disabled?: boolean
  onDiscard: () => void;
  onSave: () => void;
  onAddFileBtnClick: () => void;
  saving?: boolean;
  editMode?: boolean;
}

export const inputTypes = { text: "text", video: "video", audio: "audio" };

export function FooterBtnGroup({
  onDiscard,
  onSave,
  onAddFileBtnClick,
  saving = false,
  editMode = false,
  disabled = false
}: IFooterBtnGroup) {
  return (
    <div
      className={`mt-2 flex items-center justify-between ${disabled && "!cursor-not-allowed opacity-40"}`}
    >
      <AddFileButton disabled={disabled} onClick={onAddFileBtnClick} />
      {editMode ? (
        <div className="flex items-center gap-2">
          <button
            disabled={disabled}
            onClick={() => onDiscard()}
            className="btn-outline !border-[#C7C9C8]"
          >
            Cancel
          </button>
          <button
            disabled={disabled}
            onClick={() => onSave()}
            className="btn flex items-center gap-2"
          >
            Continue
            <Spinner loading={saving} className="!size-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button
            disabled={disabled}
            onClick={() => onDiscard()}
            className="btn-outline !border-[#C7C9C8]"
          >
            Cancel
          </button>
          <button
            disabled={disabled}
            onClick={() => onSave()}
            className="btn flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
            <Spinner loading={saving} className="!size-4" />
          </button>
        </div>
      )}
    </div>
  )
}