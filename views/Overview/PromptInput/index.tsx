"use client"

import TextIcon from "@/public/icon/text.svg"
import VideoIcon from "@/public/icon/video.svg"
import MicIcon from "@/public/icon/mic.svg"
import { useMemo } from "react"
import AudioRec from "./AudioRec"
import VideoRec from "./VideoRec"
import TextArea from "./TextArea"
import AddFileButton from "./AddFileButton"
import { usePrompt } from "@/hooks/use-prompt"

const inputTypes = { text: "text", video: "video", audio: "audio" }

const renderIcons = {
  [inputTypes.text]: <TextIcon width={11} />,
  [inputTypes.video]: <VideoIcon width={14} height={10} />,
  [inputTypes.audio]: <MicIcon width={9} height={13} />,
};

export default function PromptInput() {
  const { type, set, navigations, push, edit_mode, onDiscard, onSave } = usePrompt()

  const renderInputComponent = useMemo(() => {
    switch (type) {
      case inputTypes.video:
        return <VideoRec />;
      case inputTypes.audio:
        return <AudioRec />;
      default:
        return <TextArea />;
    }
  }, [type]);


  if (navigations[0] !== "prompt") return
  return (
    <div>
      <h4 className="modal-title">What is one of your earliest childhood memories</h4>
      <div className="mt-5">
        <div className="w-full">
          {renderInputComponent}
        </div>
        <div className="flex justify-between items-center mt-2">
          <AddFileButton />
          {
            edit_mode ?
              <div className="space-x-2">
                <button onClick={onDiscard} className="btn-outline !border-[#C7C9C8]">Cancel</button>
                <button onClick={onSave} className="btn">Save</button>
              </div> :
              <div className="flex items-center gap-2">
                {
                  Object.values(inputTypes).map(t => (
                    <div
                      key={t}
                      onClick={() => set("type", t)}
                      className={`bg-grey-500 w-10 cursor-pointer aspect-square rounded-full border border-[#344054] flex items-center justify-center text-[#344054] ${t === type ? "border" : "border-0"}`}
                    >
                      {renderIcons[t]}
                    </div>
                  ))
                }
              </div>
          }
        </div>
      </div>
    </div>
  )
}