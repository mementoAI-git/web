import { useModal } from "@/hooks/use-modal";
import TimesIcon from "@/public/icon/times.svg";
import CopyIcon from "@/public/icon/copy.svg";
import Image from "next/image";
import facebook from "@/public/image/Facebook.png";
import twitter from "@/public/image/twitter.png";
import instagram from "@/public/image/instagram.png";
import linkedin from "@/public/image/linkedin.png";

export function SharePost({ data }) {
  const { close } = useModal();
  return (
    <div className="modal-container !max-w-120">
      <div onClick={() => close()} className="modal-close-btn">
        <TimesIcon width={8.33} height={8.33} />
      </div>
      <div className="space-y-6">
        <h4 className="modal-title">Share this post</h4>
        <div className="space-y-6">
          <div className="font-inter text-sm font-medium !text-grey-600">
            <span>Share link</span>
            <div className="flex items-center justify-between rounded-lg border border-grey-400 bg-grey-700 p-2">
              <span className="font-normal">www.memento.io/post/73f9320d</span>
              <button className="flex cursor-pointer items-center justify-center gap-1 rounded-sm bg-secondary px-3 py-2 text-white">
                <CopyIcon width={16} />
                <span>Copy</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-grey-500" />
            <span className="font-inter text-xs text-[#667085]">
              Or share on Social Media
            </span>
            <div className="flex-1 border-t border-grey-500" />
          </div>

          <div className="flex items-center justify-between gap-11">
            {[facebook, linkedin, twitter, instagram].map((img, i) => (
              <div
                key={i}
                className="flex size-17 items-center justify-center rounded-full border border-grey-400"
              >
                <Image
                  className="size-8 object-contain"
                  src={img}
                  key={i}
                  alt="social logos"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
