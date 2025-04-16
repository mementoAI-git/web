import { useModal } from "@/hooks/use-modal"
import TimesIcon from "@/public/icon/times.svg"
import CopyIcon from "@/public/icon/copy.svg"
import Image from "next/image";
import facebook from "@/public/image/Facebook.png"
import twitter from "@/public/image/twitter.png"
import instagram from "@/public/image/instagram.png"
import linkedin from "@/public/image/linkedin.png"

export function SharePost({ data }) {
  const { close } = useModal()
  return (
    <div className="modal-container !max-w-120">
      <div onClick={() => close()} className="absolute flex justify-center items-center cursor-pointer top-10 right-10 w-9 aspect-square rounded-full bg-grey-400">
        <TimesIcon width={8.33} height={8.33} />
      </div>
      <div className="space-y-6">
        <h4 className="modal-title">Share this post</h4>
        <div className="space-y-6">
          <div className="font-inter text-sm !text-grey-600 font-medium">
            <span>Share link</span>
            <div className="rounded-lg border border-grey-400 p-2 bg-grey-700 flex items-center justify-between">
              <span className="font-normal">www.memento.io/post/73f9320d</span>
              <button className="bg-secondary rounded-sm flex items-center justify-center gap-1 cursor-pointer py-2 px-3 text-white">
                <CopyIcon width={16} />
                <span>Copy</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="border-t border-grey-500 flex-1" />
            <span className="text-xs text-[#667085] font-inter">Or share on Social Media</span>
            <div className="border-t border-grey-500 flex-1" />
          </div>

          <div className="flex justify-between items-center gap-11">
            {
              [facebook, linkedin, twitter, instagram].map((img, i) => (
                <div key={i} className="size-17 rounded-full border border-grey-400 flex items-center justify-center">
                  <Image className="size-8 object-contain" src={img} key={i} alt="social logos" />
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  )
}