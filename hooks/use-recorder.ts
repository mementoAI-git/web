import { useEffect, useRef, useState } from "react"

export default function useRecorder(stream: MediaStream | null) {
  const [timer, setTimer] = useState(0) // secs
  const [url, setUrl] = useState<string | null>(null)
  const [recording, setRecording] = useState(false);
  const [recordedChucks, setRecordedChucks] = useState<Blob[]>([])
  const recorder = useRef<MediaRecorder | null>(null)
  const timeId = useRef<NodeJS.Timeout | undefined>(undefined)

  const start = () => {
    if (!recorder.current) return;
    recorder.current.start()
    setRecordedChucks([])
    setRecording(true)
  }

  const stop = () => {
    if (!recorder.current) return;
    recorder.current.stop()
    setRecording(false)
  }

  const pause = () => {
    if (!recorder.current || recorder.current.state !== "recording") return;
    recorder.current.pause()
    setRecording(false)
  }

  const resume = () => {
    if (!recorder.current || recorder.current.state !== "recording") return;
    recorder.current.resume()
    setRecording(true)
  }

  const save = () => {

  }

  useEffect(() => {
    if (recording) {
      timeId.current = setInterval(() => {
        setTimer(p => p + 1)
      }, 1000)
    }
    if (!recording && timeId) {
      clearInterval(timeId.current)
    }
  }, [recorder.current?.state])

  useEffect(() => {
    if (stream) {
      recorder.current = new MediaRecorder(stream)

      recorder.current.ondataavailable = (ev) => {
        if (ev.data.size > 0) {
          setRecordedChucks(p => [...p, ev.data])
        }
      }

      recorder.current.onstop = (ev) => {
        const blob = new Blob(recordedChucks)
        const url = URL.createObjectURL(blob)
        setUrl(url)
      }
    }
  }, [stream])

  return {
    recording,
    recorder: recorder.current,
    recordedChucks,
    stop,
    start,
    pause,
    resume,
    url,
    timer
  }
}