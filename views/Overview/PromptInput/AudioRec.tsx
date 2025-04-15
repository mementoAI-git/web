import AletHexagonIcon from "@/public/icon/alert-hexagon.svg"
import RecIndicator from "@/components/RecIndicator"
import useRecorder from "@/hooks/use-recorder"
import React, { useState } from "react"
import { AudioRecButtons } from "./RecButtons"
import AudioVisualizer from "@/components/AudioVisualizer"
import { usePrompt } from "@/hooks/use-prompt"

export default function AudioRec() {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const recorder = useRecorder(stream, setStream, "audio/webm")
  const { set } = usePrompt()

  const startRec = () => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        if (stream) {
          setStream(stream)
          setTimeout(recorder.start, 2000)
          set("edit_mode", true)
        }
      })
      .catch(error => {
        console.error("Mic access denied or not available.", error);
      })
  }
  return (
    <div>
      <div className="flex items-center justify-center rounded-t-2xl py-1 bg-grey-400 text-grey-800">
        <div className="flex items-center gap-1">
          <AletHexagonIcon width={16} height={16} />
          <span className="font-inter text-xs">Max audio recording length is 4 minutes</span>
        </div>
      </div>
      <div className="w-full min-h-100 flex items-center rounded-b-2xl justify-center border border-t-0 border-grey-400">
        <div>
          {
            recorder.url ?
              <div>
                <audio src={recorder.url} controls playsInline />
              </div> :
              <div className="flex self-center flex-col gap-3">
                <div className="flex items-center gap-2">
                  <RecIndicator counter={recorder.timer} recoding={recorder.recording} />
                  <AudioVisualizer recorder={recorder.recorder} />
                </div>
                <AudioRecButtons {...{ ...recorder, start: startRec }} />
              </div>
          }
        </div>
      </div>
    </div>
  )
}