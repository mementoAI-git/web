import Image from "next/image";
import questionIcon from "@/public/image/question.png";
import quizIcon from "@/public/image/lighten.png";
import { useModal } from "@/hooks/use-modal";
import { cn } from "@/utility";

interface IDailyPrompt {
  type: string;
  title: string;
  _id: string;
}
export default function DailyPrompt({ type, title, _id }: IDailyPrompt) {
  const { open } = useModal()

  const handleReplyClick = () => {
    open("prompt", { title, prompt: _id })
  };
  return (
    <div className="group flex h-64 sm:h-72.5 w-full cursor-pointer flex-col justify-between rounded-xl sm:rounded-2xl bg-grey-700 p-4 sm:p-6 lg:p-8">
      <Image
        className="size-12 sm:size-14 lg:size-16"
        src={type === "quiz" ? quizIcon : questionIcon}
        alt=""
      />
      <div>
        <span className="mb-2 inline-block w-fit rounded-full bg-black/5 px-2 sm:px-3 py-1 font-inter text-xs font-medium text-[#050709] uppercase">
          {type}
        </span>
        <div className="space-y-2 sm:space-y-3">
          <span className="block text-grey-900 font-inter text-sm sm:text-base font-semibold leading-tight">{title}</span>
          <button
            onClick={handleReplyClick}
            className={cn("cursor-pointer bg-secondary hover:bg-[#000626b3] rounded-full shadow-btn hover:scale-[97%] px-3 sm:px-4 lg:px-5 py-1.5 sm:py-2 font-inter text-sm sm:text-base font-semibold text-white transition-all duration-150 hidden group-hover:flex")}
          >
            Reply
          </button>
        </div>
      </div>
    </div>
  );
}
