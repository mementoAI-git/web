import AddImageIcon from "@/public/icon/add-image.svg"
import FileIcon from "@/public/icon/file.svg"
import BinIcon from "@/public/icon/bin.svg"
import { useEffect, useRef, useState } from "react"

export default function FileUploadItem() {
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