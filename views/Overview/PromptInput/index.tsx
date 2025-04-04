"use client"

import TextIcon from "@/public/icon/text.svg"
import VideoIcon from "@/public/icon/video.svg"
import MicIcon from "@/public/icon/mic.svg"
import PlusIcon from "@/public/icon/plus.svg"
import { useMemo, useState } from "react"
import AudioRec from "./AudioRec"
import VideoRec from "./VideoRec"
import TextArea from "./TextArea"

const inputTypes = { text: "text", video: "video", audio: "audio" }

function RenderInput({ }) {

}

const renderIcons = {
  [inputTypes.text]: <TextIcon width={11} />,
  [inputTypes.video]: <VideoIcon width={14} height={10} />,
  [inputTypes.audio]: <MicIcon width={9} height={13} />,
};

export default function PromptInput() {
  const [type, setType] = useState("text")
  const [text, setText] = useState("")
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null)
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null)

  const renderInputComponent = useMemo(() => {
    switch (type) {
      case inputTypes.video:
        return <VideoRec stream={videoStream} setStream={setVideoStream} />;
      case inputTypes.audio:
        return <AudioRec stream={audioStream} setStream={setAudioStream} />;
      default:
        return <TextArea value={text} onChange={(e) => setText(e.target.value)} />;
    }
  }, [type, text, videoStream, audioStream]);

  const editMode = useMemo(
    () => text.length > 0 || videoStream || audioStream,
    [text, videoStream, audioStream]
  );

  return (
    <div>
      <h4 className="modal-title">What is one of your earliest childhood memories</h4>
      <div className="mt-5">
        <div className="w-full">
          {renderInputComponent}
        </div>
        <div className="flex justify-between items-center mt-2">
          <div className="w-10 cursor-pointer aspect-square rounded-full border border-[#EAECF0] flex items-center justify-center">
            <PlusIcon width={12} height={12} />
          </div>
          {
            editMode ?
              <div className="space-x-2">
                <button className="btn-outline !border-[#C7C9C8]">Cancel</button>
                <button className="btn">Save</button>
              </div> :
              <div className="flex items-center gap-2">
                {
                  Object.values(inputTypes).map(t => (
                    <div
                      key={t}
                      onClick={() => setType(t)}
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