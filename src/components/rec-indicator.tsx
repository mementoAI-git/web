import { getDuration } from "@/utility";

interface RecIndicatorProps {
  counter?: number;
  recoding?: boolean;
  className?: string;
}

export default function RecIndicator({ counter = 0, recoding = false, className = "" }: RecIndicatorProps) {
  const { secs, mins, hrs } = getDuration(counter);
  return (
    <div className={`flex flex-1 gap-1 rounded-full bg-grey-400 px-2 py-1.5 text-grey-600 ${className}`}>
      <div className="flex aspect-square w-5 items-center justify-center rounded-full bg-white">
        <span className="relative flex size-[7px]">
          <span
            className={`absolute inline-flex h-full w-full ${recoding ? "animate-ping" : ""} rounded-full bg-fill-error-strong opacity-75`}
          />
          <span className="relative inline-flex size-[7px] rounded-full bg-fill-error-strong" />
        </span>
      </div>
      <span className="font-inter text-sm font-medium">
        {hrs}:{mins}:{secs}
      </span>
    </div>
  );
}
