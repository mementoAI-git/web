import AddFileButton from "@/components/AddFileButton";

import TextIcon from "@/public/icon/text.svg";
import VideoIcon from "@/public/icon/video.svg";
import MicIcon from "@/public/icon/mic.svg";

import Spinner from "@/components/Spinner";
import { isEmpty } from "@/utility";
import { IMemory } from "@/utility/interface";
import { useModal } from "@/hooks/use-modal";

interface IPromptInputFooter {
  type: string
  memory: IMemory
  editMode?: boolean;
  onDiscard: () => void;
  onSave: () => void;
  saving?: boolean;
  loading?: boolean
}
export const inputTypes = { text: "text", video: "video", audio: "audio" };

const renderIcons = {
  [inputTypes.text]: <TextIcon width={11} />,
  [inputTypes.video]: <VideoIcon width={14} height={10} />,
  [inputTypes.audio]: <MicIcon width={9} height={13} />,
};

export default function PromptInputFooter({ type = "text", memory, editMode, loading = false, saving = false, onDiscard, onSave }: IPromptInputFooter) {
  const { open } = useModal()
  const handleFileUploadBtn = () => {
    if (isEmpty(memory?._id)) return;
    open("file-upload", memory?._id)
  }

  return (
    <div
      className={`mt-2 flex items-center justify-between ${loading && "!cursor-not-allowed opacity-40"}`}
    >
      <AddFileButton onClick={handleFileUploadBtn} />
      {editMode ? (
        <div className="flex items-center gap-2">
          <button
            disabled={loading}
            onClick={onDiscard}
            className="btn-outline !border-[#C7C9C8]"
          >
            Cancel
          </button>
          <button
            disabled={loading}
            onClick={onSave}
            className="btn flex items-center gap-2"
          >
            Save
            <Spinner loading={saving} className="!size-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {Object.values(inputTypes).map((t) => (
            <button
              key={t}
              disabled={loading}
              onClick={() => open("prompt", { memory, type: t })}
              className={`flex aspect-square w-10 cursor-pointer items-center justify-center rounded-full border border-[#344054] bg-grey-500 text-[#344054] ${t === type ? "border" : "border-0"}`}
            >
              {renderIcons[t]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}