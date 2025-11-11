import { Link } from "react-router-dom";
import Slider from "@/components/slider";
import StreakTracker from "@/components/streak-tracker";
import { BlueFolderIcon, PlusIcon } from "@/components/icons";
import { useModal } from "@/hooks/use-modal";
import { useStore } from "@/hooks/use-store";
import bg1 from "@/assets/image/bg/1.png";
import bg2 from "@/assets/image/bg/2.png";
import bg3 from "@/assets/image/bg/3.png";
import orangeDiamond from "@/assets/image/orange-diamond.png";
import greenDiamond from "@/assets/image/green-diamond-full.png";
import { cn } from "@/utility";

function StreakCount() {
  return (
    <StreakTracker>
      <div className="relative flex flex-1 items-center gap-2 overflow-hidden rounded-2xl border border-black/5 p-4">
        <img
          src={bg2}
          alt="Background"
          className="pointer-events-none absolute inset-0 size-full object-cover"
        />
        <div className="flex max-w-[216.86px] flex-col gap-2 font-inter">
          <span className="font-inter text-xs font-normal uppercase text-gray-500">
            Streak count
          </span>
          <span className="font-inter text-sm font-bold text-gray-700">
            You’re on a 15-day streak
          </span>
          <span className="font-inter text-sm font-normal text-gray-600">
            Complete reflections each day so your streak won’t reset
          </span>
        </div>
        <div className="pointer-events-none absolute bottom-0 right-0 flex size-full max-h-[100px] max-w-[105.31px] items-center justify-center">
          <img
            src={orangeDiamond}
            className="size-full object-cover"
            width={105.31}
            alt="Orange diamond"
          />
        </div>
      </div>
    </StreakTracker>
  );
}

function Leaderboard() {
  return (
    <div className="relative flex flex-1 items-center gap-2 overflow-hidden rounded-2xl border border-black/5 p-4">
      <img
        src={bg3}
        alt="Background"
        className="pointer-events-none absolute inset-0 size-full object-cover"
      />
      <div className="flex flex-col gap-2 font-inter">
        <span className="text-xs uppercase text-gray-400">XP leaderboard</span>
        <span className="text-sm font-bold text-gray-700">Global ranking coming soon</span>
        <span className="text-sm text-gray-600">Coming soon</span>
      </div>
      <div className="pointer-events-none absolute -bottom-0 right-0 flex size-full max-h-[148.38px] max-w-[135.64px] items-center justify-center">
        <img src={greenDiamond} className="size-full object-cover" alt="Green diamond" />
      </div>
    </div>
  );
}

export default function WelcomeSection() {
  const { user } = useStore();
  const { open } = useModal();

  return (
    <div className="w-full space-y-6 sm:space-y-8 lg:space-y-10 py-6 sm:py-9 lg:py-12">
      <div className="space-y-2">
        <h2 className="font-garamond text-gray-800 font-medium text-[24px] sm:text-[32px] leading-[32px] sm:leading-[38px]">
          Back at it,
          {
            user?.first_name &&
            <i className="text-gray-500"> {user?.first_name}.</i>
          }
        </h2>
        {/* <span className="text-gray-500 font-georgia text-[16px] sm:text-[20px] lg:text-[24px] leading-5 sm:leading-[28px] lg:leading-[32px]">
        Complete some unfinished prompts to earn points.
      </span> */}
      </div>
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        <div className="relative rounded-2xl overflow-hidden flex-1 min-h-[144px] sm:min-h-[254px]">
          <img src={bg1} alt="" className="absolute top-0 right-0 left-0 object-cover size-full" />
          <div className="absolute border border-sand-3 rounded-2xl p-5 sm:p-8 lg:p-10 bg-[linear-gradient(266.6deg,rgba(254,251,248,0)_10.3%,#FEFBF8_80.25%)] flex flex-col justify-between size-full top-0 right-0 left-0">
            <h2 className="font-georgia text-base sm:text-lg md:text-xl lg:text-2xl text-[#475467]">What’s on your mind today?</h2>
            <div className="flex gap-3 items-stretch">
              <button onClick={() => open("create-memory")} className="btn md:!bg-blue-6 !text-sm !md:text-base !px-4 !sm:px-5 !py-1.5 !sm:py-2.5">
                <PlusIcon className="size-4 hidden md:block" />
                <span className="whitespace-nowrap">
                  Add a memory
                </span>
              </button>
              <Link
                to="/chat/new"
                className="bg-white flex items-center gap-1.5 cursor-pointer hover:scale-[97%] border border-white rounded-full px-4 sm:px-5 py-1.5 sm:py-2.5"
              >
                <span className="size-5 hidden md:block">
                  <BlueFolderIcon className="size-5" />
                </span>
                <span className="text-[#101828] text-sm  font-inter font-semibold whitespace-nowrap">Start a conversation</span>
              </Link>
            </div>
          </div>
        </div>
        <div className="block md:hidden">
          <Slider>
            <StreakCount />
            <Leaderboard />
          </Slider>
        </div>
        <div className="w-full hidden md:flex flex-rol items-stretch gap-3 md:flex-col md:flex-1 lg:max-w-[335px]">
          <StreakCount />
          <Leaderboard />
        </div>
      </div>
    </div>
  );
}

