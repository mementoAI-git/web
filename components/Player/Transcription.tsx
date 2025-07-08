import endpoint from "@/api/endpoint"
import { postFetcher } from "@/api/fetcher"
import useSWR from "swr"
import { useCallback, useState, useEffect } from "react"
import useTypingEffect from "@/hooks/use-typing-effect"
import { toast } from "sonner"
import { isEmpty } from "@/utility"

const fetchTranscription = async (id: string) => {
  const result = await postFetcher(endpoint.transcription, { arg: { file_id: id } })
  if (result.success) return String(result.data);
  toast.error("Failed to fetch transcription")
}

export default function Transcription({ id }: { id: string }) {
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

  // Responsive font size
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

  const typedText = useTypingEffect(isEmpty(data) ? "" : data)
  console.log(typedText)
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
          <span
            className="font-inter font-medium text-white"
            style={{ fontSize: getFontSize(data.length), transition: 'font-size 0.2s' }}
          >
            {typedText}
          </span>
        </div>
      }
    </div>
  )
}