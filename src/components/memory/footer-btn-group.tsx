import AddFileButton from "@/components/add-file-button";
import Spinner from "@/components/spinner";

interface FooterBtnGroupProps {
  disabled?: boolean;
  onDiscard: () => void;
  onSave: () => void;
  onAddFileBtnClick?: () => void;
  saving?: boolean;
  editMode?: boolean;
  cta?: string;
  discardLabel?: string;
  discardDisabled?: boolean;
}

export const inputTypes = {
  text: "text",
  video: "video",
  audio: "audio",
} as const;

export function FooterBtnGroup({
  onDiscard,
  onSave,
  onAddFileBtnClick,
  saving = false,
  editMode = false,
  disabled = false,
  cta = "Continue",
  discardLabel = "Cancel",
  discardDisabled,
}: FooterBtnGroupProps) {
  const isDiscardDisabled = discardDisabled ?? disabled;
  const dimWhenDisabled = disabled && (discardDisabled === undefined || discardDisabled);
  return (
    <div
      className={`mt-2 flex items-center justify-between ${dimWhenDisabled ? "cursor-not-allowed opacity-40" : ""}`}
    >
      <div>
        {onAddFileBtnClick && (
          <AddFileButton disabled={disabled} onClick={onAddFileBtnClick} />
        )}
      </div>

      {editMode ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isDiscardDisabled}
            onClick={onDiscard}
            className="btn-outline border-stroke-neutral-weaker!"
          >
            {discardLabel}
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
            disabled={isDiscardDisabled}
            onClick={onDiscard}
            className="btn-outline border-stroke-neutral-weaker!"
          >
            {discardLabel}
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={onSave}
            className="btn flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cta}
            <Spinner loading={saving} className="size-4!" />
          </button>
        </div>
      )}
    </div>
  );
}
