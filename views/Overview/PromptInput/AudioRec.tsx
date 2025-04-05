import AletHexagonIcon from "@/public/icon/alert-hexagon.svg"
import RecIndicator from "@/components/RecIndicator"
import useRecorder from "@/hooks/use-recorder"
import React, { useState } from "react"
import { AudioRecButtons } from "./RecButtons"
import AudioVisualizer from "@/components/AudioVisualizer"
import { IRec } from "./VideoRec"

export default function AudioRec({ stream, setStream }: IRec) {
  const { start, stop, pause, resume, timer, recorder, recording } = useRecorder(stream)

  const startRec = () => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        if (stream) {
          setStream(stream)
          setTimeout(start, 1000)
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
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <RecIndicator counter={timer} recoding={recording} />
            <AudioVisualizer recorder={recorder} />
          </div>
          <AudioRecButtons {...{ resume, stop, pause, timer, recording, start: startRec }} />
        </div>
      </div>
    </div>
  )
}