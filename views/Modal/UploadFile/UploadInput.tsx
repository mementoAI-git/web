import AddImageIcon from "@/public/icon/add-image.svg"
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react"
import { v4 as uuidv4 } from 'uuid';
import { IFileState } from ".";

interface IFileUploadinput {
  onUpload: (f: IFileState) => void
}

export default function FileUploadInput({ onUpload }: IFileUploadinput) {
  const ref = useRef<HTMLLabelElement>(null)
  const [height, setHeight] = useState(425)

  const handleUpload = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files[0]
    onUpload({ id: uuidv4(), file, progress: 0 })
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
    <label
      htmlFor="file-upload"
      ref={ref}
      className="flex-1 min-h-[40px] sm:min-h-[154px] max-h-[300px] sm:max-h-[425px] h-full p-2 sm:p-3 lg:p-4 bg-[#FCFCFD] rounded-xl sm:rounded-2xl border border-dashed border-grey-500 flex justify-center items-center flex-col gap-3 sm:gap-4 lg:gap-6"
    >
      <AddImageIcon
        width={16}
        height={16}
        className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-grey-600"
      />

      <input
        id="file-upload"
        type="file"
        name="file"
        hidden
        onChange={handleUpload}
      />

      <div className="flex flex-col font-inter text-center justify-center items-center gap-1 sm:gap-2">
        <span className="text-xs sm:text-sm lg:text-base text-grey-600 leading-tight">
          <span className="hidden sm:inline">
            Drag and drop your file here or{" "}
          </span>
          <span className="sm:hidden">Tap to upload</span>
          <span className="hidden sm:inline">click to upload</span>
        </span>
        <span className="text-xs text-grey-800 leading-tight">
          Max file size: 120mb
        </span>
      </div>

      {height > 154 && (
        <span className="btn !font-medium text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5">
          Browse files
        </span>
      )}
    </label>
  )
}