import MicIcon from "@/public/icon/mic.svg";
import StopRecIcon from "@/public/icon/stop-rec.svg";
import PauseRecIcon from "@/public/icon/pause-rec.svg";
import React from "react";

interface IRecButtons {
  pause: () => void;
  resume: () => void;
  start: () => void;
  stop: () => void;
  recording?: boolean;
  timer?: number;
}

export function AudioRecButtons({
  pause,
  resume,
  start,
  stop,
  recording = false,
  timer = 0,
}: IRecButtons) {
  if (recording) {
    return (
      <button
        onClick={pause}
        className="btn flex flex-1 items-center justify-center gap-2 !bg-[#F5FAFF] !text-[#2E90FA]"
      >
        <PauseRecIcon width={12} />
        <span className="font-inter text-sm font-semibold">Pause</span>
      </button>
    );
  }
  if (timer > 0) {
    return (
      <React.Fragment>
        <button
          onClick={resume}
          className="btn flex flex-1 items-center justify-center gap-2 !bg-[#F5FAFF] !text-[#2E90FA]"
        >
          <MicIcon width={12} />
          <span className="font-inter text-sm font-semibold">Resume</span>
        </button>
        <button
          onClick={stop}
          className="btn flex flex-1 items-center justify-center gap-2 !bg-[#FEF3F2] !text-[#F97066]"
        >
          <StopRecIcon width={15} />
          <span className="font-inter text-sm font-semibold">End</span>
        </button>
      </React.Fragment>
    );
  }
  return (
    <button
      onClick={start}
      className="btn flex flex-1 items-center justify-center gap-2"
    >
      <MicIcon width={12} />
      <span className="font-inter text-sm font-semibold">Start</span>
    </button>
  );
}

export function VideoRecButtons({
  pause,
  resume,
  start,
  stop,
  recording = false,
  timer = 0,
}: IRecButtons) {
  if (recording) {
    return (
      <button
        onClick={pause}
        className="btn mx-auto !bg-white/[22%] !text-white"
      >
        Pause
      </button>
    );
  }
  if (timer > 0) {
    return (
      <div className="flex items-center justify-center gap-2">
        <button onClick={resume} className="btn !bg-white/[22%] !text-white">
          Resume
        </button>
        <button onClick={stop} className="btn !bg-white/[22%] !text-white">
          End
        </button>
      </div>
    );
  }

  return (
    <button onClick={start} className="btn mx-auto !bg-white/[22%] !text-white">
      Start
    </button>
  );
}
