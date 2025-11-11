import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import endpoint from "@/api/endpoint";
import { postFetcher } from "@/api/fetcher";

interface TranscriptionSegment {
  text: string;
  start: number;
  end: number;
}

interface TimedTranscription {
  segments: TranscriptionSegment[];
  full_text: string;
}

const fetchTranscription = async (id: string): Promise<TimedTranscription> => {
  const result = await postFetcher(endpoint.transcription, { arg: { file_id: id } });
  if (result.success) {
    return result.data as TimedTranscription;
  }
  toast.error("Failed to fetch transcription");
  return { segments: [], full_text: "" };
};

interface TranscriptionProps {
  id: string;
  currentTime?: number;
}

export default function Transcription({ id, currentTime = 0 }: TranscriptionProps) {
  const [show, setShow] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { data, isLoading } = useSWR(show ? [`/${endpoint.transcription}/${id}`] : null, () => fetchTranscription(id));

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const currentSegment = useMemo(() => {
    if (!data?.segments || currentTime === 0) return null;

    return (
      data.segments.find((segment) => currentTime >= segment.start && currentTime <= segment.end) ||
      data.segments.find((segment) => currentTime >= segment.start) ||
      null
    );
  }, [data?.segments, currentTime]);

  const getFontSize = (length: number) => {
    if (isMobile) {
      if (length <= 100) return "20px";
      if (length >= 1000) return "12px";
      return `${20 - ((length - 100) * 8) / 900}px`;
    }
    if (length <= 100) return "30px";
    if (length >= 1000) return "16px";
    return `${30 - ((length - 100) * 14) / 900}px`;
  };

  const handleToggle = useCallback(() => {
    setShow((prev) => !prev);
  }, []);

  const renderedSegments = useMemo(() => {
    if (!data?.segments || data.segments.length <= 1) return null;

    return data.segments.map((segment, index) => {
      const isCurrent = currentSegment?.text === segment.text;
      const isPast = currentTime > segment.end;
      const isHighlighted = isCurrent || isPast;

      return (
        <span
          key={index}
          className={`transition-colors duration-300 ${isHighlighted ? "text-white" : "text-[#6D7276]"}`}
          style={{ fontSize: getFontSize(segment.text.length) }}
        >
          {segment.text}
          {index < data.segments.length - 1 && " "}
        </span>
      );
    });
  }, [data?.segments, currentSegment, currentTime, isMobile]);

  const buttonLabel = !show || isLoading ? (isLoading ? "Showing transcription..." : "Show transcription") : "Hide transcription";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleToggle}
        className="mx-auto block cursor-pointer text-center font-inter text-xs text-secondary underline-offset-2 hover:underline"
      >
        {buttonLabel}
      </button>
      {show && data && (
        <div className="pointer-events-auto absolute left-1/2 top-full z-10 mt-2 max-h-[442px] w-full max-w-[518px] -translate-x-1/2 overflow-hidden rounded-2xl bg-grey-600 p-4 shadow-lg sm:max-w-md sm:p-5 md:max-w-lg lg:max-w-xl">
          <div className="relative overflow-hidden">
            {renderedSegments ? (
              <div className="font-inter font-medium leading-relaxed">{renderedSegments}</div>
            ) : (
              <span
                className="font-inter font-medium text-[#6D7276]"
                style={{ fontSize: getFontSize(data.full_text?.length || 0), transition: "font-size 0.2s" }}
              >
                {data.full_text || ""}
              </span>
            )}
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-grey-600 to-transparent" />
          </div>
        </div>
      )}
    </div>
  );
}
