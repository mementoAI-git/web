import endpoint from "@/api/endpoint";
import { use } from "react";
import useSWR from "swr";
import CapsulesSidebar from "./components/sidebard";
import { ChevronLeftIcon, TimesIcon } from "@/components/icons";
import { useNavigate } from "react-router-dom";

export default function CapsulePage({ params }) {
  const { id } = use(params) as { id: string };
  const { data } = useSWR(id ? `${endpoint.capsule}/${id}` : null)
  const capsuleData = data?.data
  const navigate = useNavigate();
  return (
    <div className="flex">
      <div className="flex-1 py-6 px-6">
        <div className="space-y-3">
          <button onClick={() => navigate(-1)} className="flex cursor-pointer items-center gap-1 rounded-full bg-grey-400 px-3 py-1.5 text-black">
            <ChevronLeftIcon width={10} height={10} />
            <span className="font-inter text-sm text-grey-600">Back</span>
          </button>
          <span className="font-inter capitalize text-4xl font-medium text-[#101828]">
            {capsuleData?.title}
          </span>
          <div className="flex items-center mt-6 gap-3">
            <span className="text-[#667085] text-xs font-inter">To (recipients):</span>
            <div className="flex flex-wrap gap-2">
              {capsuleData?.recipients.map((r, i) => (
                <span
                  key={i}
                  className="mem-tags w-fit flex gap-2 items-center !lowercase !font-normal !text-grey-600"
                >
                  <span className="block max-w-40 truncate whitespace-nowrap">
                    {r.email}
                  </span>
                  <TimesIcon width={7} />
                </span>
              ))}
            </div>
          </div>
          <div className="mt-3 border-t border-grey-500" />
          <div className="font-inter text-sm text-grey-600">
            <span>{capsuleData?.body}</span>
          </div>
        </div>
      </div>
      <div className="w-[29%] max-w-[333px] shrink-0">
        <CapsulesSidebar data={capsuleData?.data} />
      </div>
    </div>
  )
}