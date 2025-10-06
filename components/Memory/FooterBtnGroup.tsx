import TextIcon from "@/public/icon/text.svg";
import VideoIcon from "@/public/icon/video.svg";
import MicIcon from "@/public/icon/mic.svg";
import Spinner from "../Spinner";
import AddFileButton from "../AddFileButton";

interface IFooterBtnGroup {
  disabled?: boolean
  onDiscard: () => void;
  onSave: () => void;
  onAddFileBtnClick: () => void;
  onTypeChange: (t: string) => void;
  type?: string
  saving?: boolean;
  editMode?: boolean;
}

export const inputTypes = { text: "text", video: "video", audio: "audio" };
const renderIcons = {
  [inputTypes.text]: <TextIcon width={11} />,
  [inputTypes.video]: <VideoIcon width={14} height={10} />,
  [inputTypes.audio]: <MicIcon width={9} height={13} />,
};

export function FooterBtnGroup({ onDiscard, onSave, onAddFileBtnClick, onTypeChange, type = "text", saving = false, editMode = false, disabled = false }: IFooterBtnGroup) {
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
          {/* {Object.values(inputTypes).map((t) => (
            <button
              key={t}
              disabled={disabled}
              onClick={() => onTypeChange(t)}
              className={`flex aspect-square w-10 cursor-pointer items-center justify-center rounded-full border border-[#344054] bg-grey-500 text-[#344054] ${t === type ? "border" : "border-0"}`}
            >
              {renderIcons[t]}
            </button>
          ))} */}
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