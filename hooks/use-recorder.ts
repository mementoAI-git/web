import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react"

export default function useRecorder(stream: MediaStream | null, setStream: Dispatch<SetStateAction<MediaStream>>, type = "video/webm") {
  const [timer, setTimer] = useState(0) // secs
  const [url, setUrl] = useState<string | null>(null)
  const [recording, setRecording] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null)
  const timeId = useRef<NodeJS.Timeout | undefined>(undefined)
  const chunks = useRef<Blob[]>([]);

  const start = () => {
    if (!recorder.current) return;
    recorder.current.start(1000)
    chunks.current = []
    setRecording(true)
  }

  const save = () => {
    const blob = new Blob(chunks.current, { type })
    setUrl(URL.createObjectURL(blob))
  }

  const stop = () => {
    if (!recorder.current) return;
    recorder.current.stop()
    setRecording(false)
    stream.getTracks().forEach(track => track.stop());
  }

  const pause = () => {
    if (!recorder.current || recorder.current.state !== "recording") return;
    recorder.current.pause()
    setRecording(false)
  }

  const resume = () => {
    if (!recorder.current) return;
    recorder.current.resume()
    setRecording(true)
  }

  useEffect(() => {
    if (recording) {
      timeId.current = setInterval(() => {
        setTimer(p => p + 1)
      }, 1000)
    }

    if (!recording && timeId.current) {
      clearInterval(timeId.current)
    }
  }, [recording])

  useEffect(() => {
    if (stream) {
      recorder.current = new MediaRecorder(stream, { mimeType: type })

      recorder.current.ondataavailable = (ev) => {
        if (ev.data.size > 0) {
          chunks.current.push(ev.data)
        }
      }

      recorder.current.onstop = () => {
        save()
        setStream(null)
        chunks.current = [];
      };
    }
  }, [stream])

  return {
    recording,
    recorder: recorder.current,
    chucks: chunks.current,
    stop,
    start,
    pause,
    resume,
    url,
    save,
    timer
  }
}