"use client"

// import { LiveAudioVisualizer } from 'react-audio-visualize';

interface IAudioVisualizer {
  recorder: MediaRecorder | null
  color?: string
}

export default function AudioVisualizer({ recorder, color = "#3C3F3E" }: IAudioVisualizer) {
  console.log(color)
  return (
    <div className="w-8 aspect-square flex items-center justify-center rounded-full bg-grey-400">
      {/* <svg width="15" height="10" viewBox="0 0 15 10" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7.5 1V9M4.5 3V7M1.5 4V6M10.5 3V7M13.5 4V6" stroke="#3C3F3E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg> */}
      {
        recorder ?
          // < LiveAudioVisualizer
          //   mediaRecorder={recorder}
          //   width={15}
          //   height={10}
          //   barWidth={1.5}
          //   gap={0}
          //   barColor={color}
          // /> 
          <div /> :
          <svg width="15" height="10" viewBox="0 0 15 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7.5 1V9M4.5 3V7M1.5 4V6M10.5 3V7M13.5 4V6" stroke="#3C3F3E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
      }
    </div>
  )
}