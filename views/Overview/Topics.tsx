import family from "@/public/image/family.png";
import Image from "next/image";

function TopicItem() {
  return (
    <div className="relative min-h-60 min-w-60 flex-1 overflow-hidden rounded-2xl bg-[#EEEEFF] p-4">
      <span className="font-bricolage text-base font-bold text-[#101828]">
        Family, friends and relationships.
      </span>
      <Image
        className="absolute right-0 -bottom-2 size-[163px] object-contain"
        src={family}
        alt=""
      />
    </div>
  );
}

export default function Topics() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between font-inter text-lg font-semibold text-grey-600">
        <span>Browse conversations by topics</span>
        <span className="cursor-pointer text-sm">See all</span>
      </div>
      <div className="flex flex-wrap items-stretch gap-3">
        <TopicItem />
        <TopicItem />
      </div>
    </div>
  );
}
