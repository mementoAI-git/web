import { PropsWithChildren } from "react";
import AddFileButton from "./AddFileButton"
import { usePrompt } from "@/hooks/use-prompt";
import TextIcon from "@/public/icon/text.svg"
import VideoIcon from "@/public/icon/video.svg"
import MicIcon from "@/public/icon/mic.svg"
import Spinner from "@/components/Spinner";
import useFetcher from "@/hooks/use-fetcher";
import endpoint from "@/api/endpoint";
import { useEffect } from "react";
import useSWR, { mutate } from "swr";

interface IPromptInputLayout extends PropsWithChildren {
  editMode?: boolean
  onDiscard: () => void
  onSave: () => void
  saving?: boolean
}

export const inputTypes = { text: "text", video: "video", audio: "audio" }

const renderIcons = {
  [inputTypes.text]: <TextIcon width={11} />,
  [inputTypes.video]: <VideoIcon width={14} height={10} />,
  [inputTypes.audio]: <MicIcon width={9} height={13} />,
};

export default function PromptInputLayout({ children, onDiscard, onSave, saving = false, editMode = false }: IPromptInputLayout) {
  const { type, set, data } = usePrompt()
  const { isLoading, data: result, error } = useSWR(`${endpoint.replyPrompt}/${data?.prompt}`)

  useEffect(() => {
    if (result) {
      set("data", result.data)
    }
    if (error) {
      set("data", null)
    }
  }, [result, error])
  console.log({ error })

  return (
    <div className="mt-5">
      <div className="w-full">
        {children}
      </div>
      <div className={`flex justify-between items-center mt-2 ${isLoading && "opacity-40 !cursor-not-allowed "}`}>
        <AddFileButton />
        {
          editMode ?
            <div className="flex items-center gap-2">
              <button disabled={saving || isLoading} onClick={onDiscard} className="btn-outline !border-[#C7C9C8]">Cancel</button>
              <button disabled={saving || isLoading} onClick={onSave} className="btn flex items-center gap-2">
                Save
                <Spinner loading={saving} className="!size-4" />
              </button>
            </div> :
            <div className="flex items-center gap-2">
              {
                Object.values(inputTypes).map(t => (
                  <button
                    key={t}
                    disabled={saving || isLoading}
                    onClick={() => set("type", t)}
                    className={`bg-grey-500 w-10 cursor-pointer aspect-square rounded-full border border-[#344054] flex items-center justify-center text-[#344054] ${t === type ? "border" : "border-0"}`}
                  >
                    {renderIcons[t]}
                  </button>
                ))
              }
            </div>
        }
      </div>
    </div>
  )
}