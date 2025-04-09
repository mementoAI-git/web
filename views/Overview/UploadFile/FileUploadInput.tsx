import AddImageIcon from "@/public/icon/add-image.svg"
import { ChangeEvent, ChangeEventHandler, useCallback, useEffect, useRef, useState } from "react"

export default function FileUploadInput() {
  const ref = useRef<HTMLLabelElement>(null)
  const [height, setHeight] = useState(425)

  const handleUpload = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.files)
  }, [])

  useEffect(() => {
    if (!ref.current) return

    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        setHeight(entry.contentRect.height)
      }
    })

    observer.observe(ref.current)

    return () => observer.disconnect()
  }, [])
  return (
    <label htmlFor="file-upload" ref={ref} className="flex-1 min-h-[154px] max-h-[425px] h-full p-3 bg-[#FCFCFD] rounded-2xl border border-dashed border-grey-500 flex justify-center items-center flex-col gap-6">
      <AddImageIcon width={20} />
      <input id="file-upload" type="file" name="file" hidden onChange={handleUpload} />
      <div className="flex flex-col font-inter text-center justify-center items-center gap-2">
        <span className="text-sm text-grey-600">Drag and drop your file here or click to upload</span>
        <span className="text-xs text-grey-800">Max file size: 120mb</span>
      </div>
      {
        height > 154 &&
        <button className="btn !font-medium">
          Browse files
        </button>
      }
    </label>
  )
}