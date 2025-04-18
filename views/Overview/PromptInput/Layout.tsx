import { PropsWithChildren } from "react";
import AddFileButton from "./AddFileButton";
import { usePrompt } from "@/hooks/use-prompt";
import TextIcon from "@/public/icon/text.svg";
import VideoIcon from "@/public/icon/video.svg";
import MicIcon from "@/public/icon/mic.svg";
import Spinner from "@/components/Spinner";
import useFetcher from "@/hooks/use-fetcher";
import endpoint from "@/api/endpoint";
import { useEffect } from "react";

interface IPromptInputLayout extends PropsWithChildren {
  editMode?: boolean;
  onDiscard: () => void;
  onSave: () => void;
  saving?: boolean;
}

export const inputTypes = { text: "text", video: "video", audio: "audio" };

const renderIcons = {
  [inputTypes.text]: <TextIcon width={11} />,
  [inputTypes.video]: <VideoIcon width={14} height={10} />,
  [inputTypes.audio]: <MicIcon width={9} height={13} />,
};

export default function PromptInputLayout({
  children,
  onDiscard,
  onSave,
  saving = false,
  editMode = false,
}: IPromptInputLayout) {
  const { type, set, data } = usePrompt();
  const { trigger, isMutating } = useFetcher(
    `${endpoint.replyPrompt}/${data?.prompt}`,
    "get",
  );

  useEffect(() => {
    if (data?.prompt) {
      trigger()
        .then((result) => set("data", result.data))
        .catch(console.log);
    }
  }, [data?.prompt]);

  return (
    <div className="mt-5">
      <div className="w-full">{children}</div>
      <div
        className={`mt-2 flex items-center justify-between ${isMutating && "!cursor-not-allowed opacity-40"}`}
      >
        <AddFileButton />
        {editMode ? (
          <div className="flex items-center gap-2">
            <button
              disabled={saving || isMutating}
              onClick={onDiscard}
              className="btn-outline !border-[#C7C9C8]"
            >
              Cancel
            </button>
            <button
              disabled={saving || isMutating}
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
                disabled={saving || isMutating}
                onClick={() => set("type", t)}
                className={`flex aspect-square w-10 cursor-pointer items-center justify-center rounded-full border border-[#344054] bg-grey-500 text-[#344054] ${t === type ? "border" : "border-0"}`}
              >
                {renderIcons[t]}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
