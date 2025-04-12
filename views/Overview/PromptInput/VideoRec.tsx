"use client"

import VideoIcon from "@/public/icon/video.svg"
import RecIndicator from "@/components/RecIndicator"
import AletHexagonIcon from "@/public/icon/alert-hexagon.svg"
import { useCallback, useEffect, useRef, useState } from "react";
import useRecorder from "@/hooks/use-recorder";
import { VideoRecButtons } from "./RecButtons";
import AudioVisualizer from "@/components/AudioVisualizer";
import { usePrompt } from "@/hooks/use-prompt";

const constraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  },
  video: true
}

export default function VideoRec() {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const ref = useRef<HTMLVideoElement>(null);
  const { set } = usePrompt()
  const recorder = useRecorder(stream, setStream)

  const startRec = useCallback(() => {
    navigator.mediaDevices.getUserMedia(constraints)
      .then(stream => {
        if (stream) {
          if (ref.current) {
            ref.current.srcObject = stream;
          }
          setStream(stream)
          setTimeout(recorder.start, 2000)
          set("edit_mode", true)
        }
      })
      .catch(error => {
        console.error("Camera access denied or not available.", error);
      })
  }, [])
  return (
    <div>
      <div className="flex items-center justify-center rounded-t-2xl py-1 bg-grey-400 text-grey-800">
        <div className="flex items-center gap-1">
          <AletHexagonIcon width={16} height={16} />
          <span className="font-inter text-xs">Max video recording length is 4 minutes</span>
        </div>
      </div>

      <div className="relative overflow-hidden w-full min-h-100 flex items-center rounded-b-2xl justify-center border border-t-0 border-grey-400">
        <video ref={ref} autoPlay playsInline muted className={`absolute z-0 top-0 right-0 size-full`} />
        {
          recorder.url ?
            <div className="absolute top-0 right-0 size-full">
              <video src={recorder.url} controls playsInline className="z-50 size-full" />
            </div> :
            stream ?
              <div className="flex flex-col justify-between z-10 p-3 absolute top-0 right-0 left-0 bottom-0 bg-transparent">
                <div className="flex items-center justify-between">
                  <div>
                    <RecIndicator
                      counter={recorder.timer}
                      recoding={recorder.recording}
                      className="!text-white !bg-white/[22%]"
                    />
                  </div>
                  <div className="w-8 aspect-square flex items-center justify-center rounded-full bg-white/[22%]">
                    <svg width="15" height="10" viewBox="0 0 15 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7.5 1V9M4.5 3V7M1.5 4V6M10.5 3V7M13.5 4V6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
                <VideoRecButtons {...{ ...recorder, start: startRec }} />
              </div> :
              <div className="flex flex-col gap-3 z-10">
                <div className="flex items-center gap-2">
                  <RecIndicator counter={recorder.timer} recoding={recorder.recording} />
                  <AudioVisualizer recorder={recorder.recorder} />
                </div>
                <button onClick={startRec} className="btn flex flex-1 justify-center items-center gap-2">
                  <VideoIcon width={20} />
                  <span className="font-inter text-sm font-semibold">Start</span>
                </button>
              </div>
        }
      </div>
    </div >
  )
}