import bgImage from "@/public/image/bg/1.png"
import bg2Image from "@/public/image/bg/2.png"
import bg3Image from "@/public/image/bg/3.png"
import blueFire from "@/public/image/blue-fire.png"
import greenDiamond from "@/public/image/green-daimond.png"
import Image from "next/image"
import PlusIcon from "@/public/icon/plus.svg"
import AIIcon from "@/public/icon/ai.svg"
import Slider from "@/components/Slider"
import { useStore } from "@/hooks/use-store"
import StreakTracker from "@/components/StreakTracker"
import { useRouter } from "next/navigation"
import { useModal } from "@/hooks/use-modal"
import Link from "next/link"

function StreakCount() {
  return (
    <StreakTracker>
      <div className="w-full flex items-center relative rounded-2xl overflow-hidden p-4 gap-2">
        <Image src={bg2Image} alt="1" className="absolute top-0 right-0 left-0 object-cover size-full" />
        <div className="flex flex-col gap-2 font-inter">
          <span className="text-gray-400 uppercase text-xs">Streak count</span>
          <span className="text-sm text-gray-700 font-bold">You’re on a 15-day streak</span>
          <span className="text-gray-600 text-sm ">Complete reflections each day so your streak won’t reset</span>
        </div>
        <div className="size-16 flex items-center justify-center">
          <Image src={blueFire} width={45} alt="Blue fire" />
        </div>
      </div>
    </StreakTracker>
  )
}

function Leaderboard() {
  return (
    <div className="w-full flex items-center rounded-2xl overflow-hidden relative p-4 gap-2">
      <Image
        src={bg3Image}
        alt="3"
        className="absolute top-0 right-0 left-0 object-cover size-full"
      />
      <div className="flex flex-col gap-2 font-inter">
        <span className="text-gray-400 uppercase text-xs">XP leaderboard</span>
        <span className="text-sm text-gray-700 font-bold">You’re ranked #45 globally</span>
        <span className="text-gray-600 text-sm ">You move up the ranking list as you complete more activities and claim more XP.</span>
      </div>
      <div className="size-[90.62px] absolute -top-3.5 right-3 flex items-center justify-center">
        <Image src={greenDiamond} width={90.62} alt="Blue fire" />
      </div>
    </div>
  )
}

export default function WelcomSection() {
  const { user } = useStore()
  const router = useRouter()
  const { open } = useModal()
  return (
    <div className="w-full space-y-6 sm:space-y-8 lg:space-y-10 py-6 sm:py-9 lg:py-12">
      <div className="space-y-2">
        <h2 className="font-canela text-sand-12 font-normal text-[24px] sm:text-[32px] lg:text-[40px] leading-[32px] sm:leading-[40px] lg:leading-[48px]">
          Welcome
          {
            user?.first_name &&
            <i className="text-gray-500">, {user?.first_name}.</i>
          }
        </h2>
        <span className="text-gray-500 font-georgia text-[16px] sm:text-[20px] lg:text-[24px] leading-5 sm:leading-[28px] lg:leading-[32px]">
          Complete some unfinished prompts to earn points.
        </span>
      </div>
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        <div className="relative rounded-2xl overflow-hidden flex-1 min-h-[144px] sm:min-h-[254px]">
          <Image src={bgImage} alt="" className="absolute top-0 right-0 left-0 object-cover size-full" />
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
                href="/chat/new"
                prefetch
                className="bg-white/40 flex items-center gap-1.5 cursor-pointer hover:scale-[97%] border border-white backdrop-blur-[2px] rounded-full px-4 sm:px-5 py-1.5 sm:py-2.5"
              >
                <span className="text-[#667085] size-5 hidden md:block">
                  <AIIcon className="size-5 stroke-2" />
                </span>
                <span className="text-[#101828] text-sm md:text-base font-inter font-medium whitespace-nowrap">Chat with AI</span>
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
        <div className="w-full hidden md:flex flex-rol items-stretch gap-3 md:flex-col lg:max-w-[335px]">
          <StreakCount />
          <Leaderboard />
        </div>
      </div>
    </div>
  )
}