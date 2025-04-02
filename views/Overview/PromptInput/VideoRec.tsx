"use client"

import RecIndicator from "@/components/RecIndicator"
import AletHexagonIcon from "@/public/icon/alert-hexagon.svg"
import { useEffect, useRef } from "react";

export default function VideoRec() {
  const videoRef = useRef<HTMLVideoElement>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      //TODO: use the toast to display this message 
      console.error("Camera access denied or not available.", err);
    }
  };

  useEffect(() => {
    // startCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream)
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, [])

  return (
    <div>
      <div className="flex items-center justify-center rounded-t-2xl py-1 bg-grey-400 text-grey-800">
        <div className="flex items-center gap-1">
          <AletHexagonIcon width={16} height={16} />
          <span className="font-inter text-xs">Max audio recording length is 4 minutes</span>
        </div>
      </div>
      <div className="relative overflow-hidden w-full min-h-100 flex items-center rounded-b-2xl justify-center border border-t-0 border-grey-400">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full" />
        <div className="flex flex-col justify-between p-3 absolute top-0 right-0 left-0 bottom-0 bg-transparent">
          <div className="flex items-center justify-between">
            <div>
              <RecIndicator className="!text-white !bg-white/[22%]" />
            </div>
            <div className="w-8 aspect-square flex items-center justify-center rounded-full bg-white/[22%]">
              <svg width="15" height="10" viewBox="0 0 15 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.5 1V9M4.5 3V7M1.5 4V6M10.5 3V7M13.5 4V6" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
          </div>
          <button className="cursor-pointer bg-white/[22%] rounded-full text-white mx-auto py-3 px-8">Start</button>
        </div>
      </div>
    </div >
  )
}