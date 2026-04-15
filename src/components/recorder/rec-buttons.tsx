import { MicIcon, PauseRecIcon, StopRecIcon } from "../icons";

type RecorderControls = {
  pause: () => void;
  resume: () => void;
  start: () => void;
  stop: () => void;
};

interface RecButtonsProps extends RecorderControls {
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
}: RecButtonsProps) {
  if (recording) {
    return (
      <button onClick={pause} className="btn flex flex-1 items-center justify-center gap-2 bg-fill-info-weak! text-text-info-strong!">
        <PauseRecIcon width={12} />
        <span className="font-inter text-sm font-semibold">Pause</span>
      </button>
    );
  }

  if (timer > 0) {
    return (
      <>
        <button onClick={resume} className="btn flex flex-1 items-center justify-center gap-2 bg-fill-info-weak! text-text-info-strong!">
          <MicIcon width={12} />
          <span className="font-inter text-sm font-semibold">Resume</span>
        </button>
        <button onClick={stop} className="btn flex flex-1 items-center justify-center gap-2 bg-fill-error-weak! text-text-error-strong!">
          <StopRecIcon width={15} />
          <span className="font-inter text-sm font-semibold">End</span>
        </button>
      </>
    );
  }

  return (
    <button onClick={start} className="btn flex flex-1 items-center justify-center gap-2">
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
}: RecButtonsProps) {
  if (recording) {
    return (
      <button onClick={pause} className="btn mx-auto bg-white/[22%]! text-white!">
        Pause
      </button>
    );
  }

  if (timer > 0) {
    return (
      <div className="flex items-center justify-center gap-2">
        <button onClick={resume} className="btn bg-white/[22%]! text-white!">
          Resume
        </button>
        <button onClick={stop} className="btn bg-white/[22%]! text-white!">
          End
        </button>
      </div>
    );
  }

  return (
    <button onClick={start} className="btn mx-auto bg-white/[22%]! text-white!">
      Start
    </button>
  );
}
