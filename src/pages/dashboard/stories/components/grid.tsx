import DOMPurify from "isomorphic-dompurify";
import { DoubleHeartIcon } from "@/components/icons";
import { ensureLinksOpenInNewTab } from "@/utility";
import { MemoryItemActions } from "./dropdown";
import type { IMemory, IPagination } from "@/utility/interface";
import dayjs from "dayjs";
import { Link, useNavigate } from "react-router-dom";
import { useState, useCallback, useEffect } from "react";
import { useModal } from "@/hooks/use-modal";

import { PlaySolidIcon, WaveIcon } from "@/components/icons";
import recordBanner from "@/assets/icon/record-banner.png";

function StoriesGridItem({ memory, isMobile }: { memory: IMemory; isMobile: boolean }) {
  const [isHovered, setIsHovered] = useState(false);
  const { open } = useModal();
  const navigate = useNavigate();

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!isMobile) {
      e.preventDefault();
      open("view-memory", { memoryId: memory._id });
    }
  }, [isMobile, open, memory._id]);

  // Find first image or video for banner
  const bannerMedia = memory.attachments.find(a =>
    a.type.includes("image") || a.type.includes("video")
  );

  // Find audio if no banner media exists
  const audioMedia = memory.attachments.find(a => a.type.includes("audio"));

  const renderContent = () => {
    // Priority 1: Image or Video Banner
    if (bannerMedia) {
      const isVideo = bannerMedia.type.includes("video");
      return (
        <div className="relative w-full overflow-hidden rounded-[16px] aspect-square bg-gray-50 border border-black/5">
          <img
            src={bannerMedia.url}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            alt={memory.title}
          />
          {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 transition-opacity group-hover:bg-black/20">
              <div className="bg-white/30 backdrop-blur-md rounded-full p-3 border border-white/40 shadow-lg">
                <PlaySolidIcon className="size-8 text-white" />
              </div>
            </div>
          )}
        </div>
      );
    }

    // Priority 2: Audio Banner (Using record-banner.png)
    if (audioMedia) {
      return (
        <div className="relative w-full overflow-hidden rounded-[16px] aspect-square bg-gray-900 flex items-center justify-center border border-black/5">
          <img
            src={recordBanner}
            className="absolute inset-0 w-full h-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
            alt="Recording Banner"
          />
          <div className="z-10 bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 flex flex-col items-center gap-3">
            <WaveIcon className="w-16 h-auto text-white opacity-80" />
            <span className="font-inter text-sm font-semibold text-white tracking-widest">
              {audioMedia.duration ? dayjs().startOf('day').add(audioMedia.duration, 'second').format('HH:mm:ss') : '00:00:00'}
            </span>
          </div>
        </div>
      );
    }

    // Default: Text Card (if no media)
    return (
      <div className="relative w-full overflow-hidden rounded-[16px] aspect-square bg-gray-50 border border-[#EEEDED] p-5 flex flex-col gap-2 shadow-sm">
        <h4 className="font-garamond font-bold text-base text-[#412C09] line-clamp-2 leading-snug">
          {memory.title}
        </h4>
        <p className="font-inter text-sm text-[#412C09CC] line-clamp-6 leading-relaxed">
          <div className="text-xs" dangerouslySetInnerHTML={{ __html: ensureLinksOpenInNewTab(DOMPurify.sanitize(memory?.body || "")) }} />
        </p>
        <div className="mt-auto pointer-events-none bg-gradient-to-t from-gray-50 via-gray-50/80 to-transparent h-16 w-full absolute bottom-0 left-0" />
      </div>
    );
  };

  return (
    <div
      className="group relative break-inside-avoid mb-8 flex w-full flex-col items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/stories/${memory?._id}`} className="w-full" onClick={handleClick}>
        {renderContent()}
      </Link>

      {/* Title Pill - Positioned 12px below the banner */}
      <div className="mt-3 z-20 transition-transform duration-300 group-hover:translate-y-0.5 flex justify-center w-full">
        <div className="bg-[#FAF6F1] border border-[#EEEDED] rounded-lg p-1 shadow-sm max-w-[90%] w-fit">
          <p className="font-inter text-center font-medium text-xs sm:text-[13px] text-[#412C09] line-clamp-2 tracking-tight leading-snug">
            {memory.title}
          </p>
        </div>
      </div>

      {/* Actions (Hover) */}
      {isHovered && (
        <div className="absolute top-3 right-3 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-black/5 overflow-hidden">
            <MemoryItemActions memory={memory} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function StoriesGrid({ data }: { data: IPagination<IMemory> }) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (!data?.docs || data.docs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-sand-3 rounded-full flex items-center justify-center">
          <DoubleHeartIcon className="size-8 stroke-2 text-sand-10" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No stories yet</h3>
        <p className="text-gray-500 text-sm max-w-xs">
          Start creating your first story to see it here.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 sm:gap-6 space-y-4 sm:space-y-6">
      {data.docs.map((m, i) => <StoriesGridItem key={i} memory={m} isMobile={isMobile} />)}
    </div>
  );
}