import AddImageIcon from "@/public/icon/add-image.svg"
import FileIcon from "@/public/icon/file.svg"
import BinIcon from "@/public/icon/bin.svg"

function FileUploadItem() {
  return (
    <div className="flex items-start rounded-lg gap-3 py-3 px-4 border border-grey-500">
      <div className="w-8 h-10 relative text-[#D5D7DA]">
        <FileIcon />
        <span className="absolute bottom-1 -left-2 p-[3px] bg-primary text-[10px] font-bold font-inter rounded-[3px] text-white">MP4</span>
      </div>
      <div className="flex-1">
        <div>
          <div className="flex justify-between items-center">
            <span className="text-secondary font-medium font-inter text-sm">Dashboard recording.mp4</span>
            <div className="text-[#A4A7AE] cursor-pointer">
              <BinIcon width={13} height={13} />
            </div>
          </div>
          <span className="text-grey-600 font-inter font-normal text-sm">16MB</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-full overflow-hidden w-full h-2 bg-grey-500">
            <div className="w-[40%] rounded-full bg-[#314FDF] h-full" />
          </div>
          <span className="text-[#3C3F3E] font-medium text-sm font-inter">40%</span>
        </div>
      </div>
    </div>
  )
}

export default function UploadModal() {
  return (
    <div>
      <h4 className="modal-title">Upload your images or videos</h4>
      <div className="mt-6 flex flex-col">
        <div className="flex flex-col gap-6 min-h-[425px]">
          <div className="flex-1 max-h-[425px] h-full p-3 bg-[#FCFCFD] rounded-2xl border border-dashed border-grey-500 flex justify-center items-center flex-col gap-6">
            <AddImageIcon width={20} />

            <div className="flex flex-col font-inter text-center justify-center items-center gap-2">
              <span className="text-sm text-grey-600">Drag and drop your file here or click to upload</span>
              <span className="text-xs text-grey-800">Max file size: 120mb</span>
            </div>

            <button className="rounded-full bg-secondary py-2 px-5 text-white font-inter font-medium">
              Browse files
            </button>
          </div>
          <div className="space-y-4">
            <FileUploadItem />
            <FileUploadItem />
            <FileUploadItem />
          </div>
        </div>
        <div className="flex mt-6 gap-3 justify-end">
          <button className="rounded-full border disabled:border-[#C7C9C8] border-secondary py-2 px-5 text-secondary disabled:text-[#C7C9C8] font-inter font-semibold">
            Discard
          </button>
          <button disabled className="rounded-full disabled:bg-[#C7C9C8] bg-secondary py-2 px-5 text-white font-inter font-semibold">
            Add to post
          </button>
        </div>
      </div>
    </div>
  )
}