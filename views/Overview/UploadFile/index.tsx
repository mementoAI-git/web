import { usePrompt } from "@/hooks/use-prompt"
import FileUploadInput from "./FileUploadInput"

export default function UploadFiles() {
  const { navigations } = usePrompt()

  if (navigations[0] !== "file-upload") return
  return (
    <div>
      <h4 className="modal-title">Upload your images or videos</h4>
      <div className="mt-6 flex flex-col">
        <div className="flex flex-col gap-6 min-h-[425px] max-h-[660px]">
          <FileUploadInput />
          {/* <div className="space-y-4 flex-1 max-h-[300px] overflow-y-auto">
            <FileUploadItem />
            <FileUploadItem />
            <FileUploadItem />
            <FileUploadItem />
            <FileUploadItem />
          </div> */}
        </div>
        <div className="flex mt-6 gap-3 justify-end">
          <button className="btn-outline">Discard</button>
          <button disabled className="btn">Add to post</button>
        </div>
      </div>
    </div>
  )
}