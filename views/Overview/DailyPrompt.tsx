import Image from "next/image";
import questionIcon from "@/public/image/question.png";
import quizIcon from "@/public/image/lighten.png";
import { usePrompt } from "@/hooks/use-prompt";

interface IDailyPrompt {
  type: string;
  title: string;
  _id: string;
}
export default function DailyPrompt({ type, title, _id }: IDailyPrompt) {
  const { push, set } = usePrompt();

  const handleReplyClick = () => {
    push("prompt");
    set("data", { title, prompt: _id, type });
  };
  return (
    <div className="group flex h-72.5 w-1/2 max-w-[368.5px] flex-1 cursor-pointer flex-col justify-between rounded-2xl bg-grey-700 p-8">
      <Image
        className="size-16"
        src={type === "quiz" ? quizIcon : questionIcon}
        alt=""
      />
      <div>
        <span className="mb-2 inline-block w-fit rounded-full bg-black/5 px-3 py-1 font-inter text-xs font-medium text-[#050709] uppercase">
          {type}
        </span>
        <div className="space-y-3">
          <span className="block font-inter font-semibold text-grey-900">
            {title}
          </span>
          <button
            onClick={handleReplyClick}
            className="btn hidden text-sm font-medium transition-all duration-500 group-hover:block disabled:bg-grey-500 disabled:text-grey-800"
          >
            Reply
          </button>
        </div>
      </div>
    </div>
  );
}
