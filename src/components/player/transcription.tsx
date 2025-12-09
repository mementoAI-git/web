import { useCallback, useEffect, useMemo, useState, useRef } from "react";
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
  const result = await postFetcher(endpoint.transcription, {
    arg: { file_id: id },
  });
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

export default function Transcription({
  id,
  currentTime = 0,
}: TranscriptionProps) {
  const [show, setShow] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { data, isLoading } = useSWR(
    show ? [`/${endpoint.transcription}/${id}`] : null,
    () => fetchTranscription(id),
  );

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const segmentRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const currentSegmentIndex = useMemo(() => {
    if (!data?.segments || currentTime === 0) return -1;

    const index = data.segments.findIndex(
      (segment) => currentTime >= segment.start && currentTime <= segment.end,
    );

    if (index !== -1) return index;

    // If not in any segment, find the last segment that has passed
    for (let i = data.segments.length - 1; i >= 0; i--) {
      if (currentTime >= data.segments[i].start) {
        return i;
      }
    }

    return -1;
  }, [data?.segments, currentTime]);

  // Auto-scroll to keep current segment centered
  useEffect(() => {
    if (
      currentSegmentIndex === -1 ||
      !scrollContainerRef.current ||
      !segmentRefs.current[currentSegmentIndex]
    ) {
      return;
    }

    const container = scrollContainerRef.current;
    const currentSegment = segmentRefs.current[currentSegmentIndex];

    if (!currentSegment) return;

    const containerHeight = container.clientHeight;
    const segmentTop = currentSegment.offsetTop;
    const segmentHeight = currentSegment.offsetHeight;

    // Calculate scroll position to center the current segment
    const targetScroll = segmentTop - containerHeight / 2 + segmentHeight / 2;

    container.scrollTo({
      top: targetScroll,
      behavior: "smooth",
    });
  }, [currentSegmentIndex]);

  const getFontSize = useCallback(
    (length: number) => {
      if (isMobile) {
        if (length <= 100) return "20px";
        if (length >= 1000) return "12px";
        return `${20 - ((length - 100) * 8) / 900}px`;
      }
      if (length <= 100) return "30px";
      if (length >= 1000) return "16px";
      return `${30 - ((length - 100) * 14) / 900}px`;
    },
    [isMobile],
  );

  const handleToggle = useCallback(() => {
    setShow((prev) => !prev);
  }, []);

  const renderedSegments = useMemo(() => {
    if (!data?.segments || data.segments.length <= 1) return null;

    return data.segments.map((segment, index) => {
      const isCurrent = index === currentSegmentIndex;
      const isPast = index < currentSegmentIndex;
      const isFuture = index > currentSegmentIndex;

      let textColor = "text-[#6D7276]"; // future/default
      if (isCurrent) {
        textColor = "text-white";
      } else if (isPast) {
        textColor = "text-[#9CA3AF]"; // slightly brighter than future
      }

      return (
        <div
          key={index}
          ref={(el) => (segmentRefs.current[index] = el)}
          className={`mb-3 transition-all duration-500 ${textColor}`}
          style={{ fontSize: getFontSize(segment.text.length) }}
        >
          {segment.text}
        </div>
      );
    });
  }, [data?.segments, currentSegmentIndex, getFontSize]);

  const buttonLabel =
    !show || isLoading
      ? isLoading
        ? "Showing transcription..."
        : "Show transcription"
      : "Hide transcription";

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
        <div className="pointer-events-auto absolute left-1/2 top-full z-10 mt-2 w-full max-w-[518px] -translate-x-1/2 rounded-2xl bg-grey-600 shadow-lg sm:max-w-md md:max-w-lg lg:max-w-xl">
          <div
            ref={scrollContainerRef}
            className="relative h-[442px] overflow-y-scroll px-4 py-8 sm:px-5 scrollbar-hide"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {/* Top padding to allow first segments to scroll to center */}
            <div className="h-[180px]" />

            {renderedSegments ? (
              <div className="font-inter font-medium leading-relaxed">
                {renderedSegments}
              </div>
            ) : (
              <div
                className="text-center font-inter font-medium text-[#6D7276]"
                style={{
                  fontSize: getFontSize(data.full_text?.length || 0),
                }}
              >
                {data.full_text || ""}
              </div>
            )}

            {/* Bottom padding to allow last segments to scroll to center */}
            <div className="h-[180px]" />

            {/* Top gradient fade */}
            <div className="pointer-events-none absolute left-0 right-0 top-0 h-24 bg-linear-to-b from-grey-600 to-transparent" />

            {/* Bottom gradient fade */}
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-linear-to-t from-grey-600 to-transparent" />
          </div>
        </div>
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
