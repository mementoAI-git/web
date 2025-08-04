import endpoint from "@/api/endpoint"
import { postFetcher } from "@/api/fetcher"
import useSWR from "swr"
import { useCallback, useState, useEffect, useMemo } from "react"
import { toast } from "sonner"

interface TranscriptionSegment {
  text: string
  start: number
  end: number
}

interface TimedTranscription {
  segments: TranscriptionSegment[]
  full_text: string
}

const fetchTranscription = async (id: string): Promise<TimedTranscription> => {
  const result = await postFetcher(endpoint.transcription, { arg: { file_id: id } })
  if (result.success) {
    return result.data
  }
  toast.error("Failed to fetch transcription")
  return { segments: [], full_text: "" }
}

interface TranscriptionProps {
  id: string
  currentTime?: number
}

export default function Transcription({ id, currentTime = 0 }: TranscriptionProps) {
  const [show, setShow] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { data, isLoading } = useSWR(
    show ? [`/${endpoint.transcription}/${id}`] : null,
    () => fetchTranscription(id)
  )

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const currentSegment = useMemo(() => {
    if (!data?.segments || currentTime === 0) return null

    return data.segments.find(segment =>
      currentTime >= segment.start && currentTime <= segment.end
    ) || data.segments.find(segment =>
      currentTime >= segment.start
    ) || null
  }, [data?.segments, currentTime])

  const getFontSize = (length: number) => {
    if (isMobile) {
      if (length <= 100) return "20px"
      if (length >= 1000) return "12px"
      return `${20 - (length - 100) * 8 / 900}px`
    } else {
      if (length <= 100) return "30px"
      if (length >= 1000) return "16px"
      return `${30 - (length - 100) * 14 / 900}px`
    }
  }

  const handleShowTranscription = useCallback(() => {
    setShow(prev => !prev)
  }, [])

  const renderedSegments = useMemo(() => {
    if (!data?.segments || data.segments.length <= 1) return null

    return data.segments.map((segment, index) => {
      const isCurrent = currentSegment?.text === segment.text
      const isPast = currentTime > segment.end
      const isHighlighted = isCurrent || isPast

      return (
        <span
          key={index}
          className={`transition-colors duration-300 ${isHighlighted ? 'text-white' : 'text-[#6D7276]'
            }`}
          style={{ fontSize: getFontSize(segment.text.length) }}
        >
          {segment.text}
          {index < data.segments.length - 1 && ' '}
        </span>
      )
    })
  }, [data?.segments, currentSegment, currentTime, isMobile])

  return (
    <div className="relative">
      <span
        onClick={handleShowTranscription}
        className="mx-auto cursor-pointer hover:underline underline-offset-2 block text-center font-inter text-xs text-secondary"
      >
        {(!show || isLoading) ? isLoading ? "Showing transcription..." : "Show transcription" : "Hide transcription"}
      </span>
      {
        show && data &&
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-full sm:max-w-md md:max-w-lg lg:max-w-xl lg:min-w-lg md:min-w-md sm:min-w-sm max-w-full overflow-x-hidden overflow-y-auto max-h-110.5 bg-grey-600 rounded-2xl p-4 sm:p-5 z-10 shadow-lg">
          {renderedSegments ? (
            <div className="font-inter font-medium leading-relaxed">
              {renderedSegments}
            </div>
          ) : (
            <span
              className="font-inter font-medium text-[#6D7276]"
              style={{ fontSize: getFontSize(data.full_text?.length || 0), transition: 'font-size 0.2s' }}
            >
              {data.full_text || ""}
            </span>
          )}
        </div>
      }
    </div>
  )
}