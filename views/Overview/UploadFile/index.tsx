import { usePrompt } from "@/hooks/use-prompt"
import FileUploadInput from "./FileUploadInput"
import { useState } from "react"
import FileUploadItem from "./FileUploadItem"

export default function UploadFiles() {
  const { navigations } = usePrompt()
  const [files, setFiles] = useState<File[]>([])

  const handleDeleteFiles = (index: number) => {
    setFiles(files => files.filter((_, i) => i !== index))
    // TODO: Delete file
  }

  if (navigations[0] !== "file-upload") return
  return (
    <div>
      <h4 className="modal-title">Upload your images or videos</h4>
      <div className="mt-6 flex flex-col">
        <div className="flex flex-col gap-6 min-h-[425px] max-h-[660px]">
          <FileUploadInput setFiles={setFiles} />
          {
            files.length > 0 &&
            <div className="space-y-4 flex-1 max-h-[300px] overflow-y-auto">
              {
                files.map((f, i) => (
                  <FileUploadItem
                    onDelete={() => handleDeleteFiles(i)}
                    file={f}
                    key={i}
                  />
                ))
              }
            </div>
          }
        </div>
        <div className="flex mt-6 gap-3 justify-end">
          <button className="btn-outline">Discard</button>
          <button disabled={files.length === 0} className="btn">Add to post</button>
        </div>
      </div>
    </div>
  )
}