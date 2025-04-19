"use client"

import { useMemo } from "react"
import AudioRec from "./AudioRec"
import VideoRec from "./VideoRec"
import TextArea from "./TextArea"
import { usePrompt } from "@/hooks/use-prompt"

export default function PromptInput() {
  const { type, navigations, data } = usePrompt()

  const renderInputComponent = useMemo(() => {
    switch (type) {
      case "video":
        return <VideoRec />;
      case "audio":
        return <AudioRec />;
      default:
        return <TextArea />;
    }
  }, [type]);


  if (navigations[0] !== "prompt") return
  return (
    <div>
      <h4 className="modal-title">{data?.title}</h4>
      {renderInputComponent}
    </div>
  )
}