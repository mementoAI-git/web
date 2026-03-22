import { Link } from "react-router-dom";
import { LaunchIcon } from "@/components/icons";
import type { IPrompt } from "@/utility/interface";
import questionIcon from "@/assets/image/question-2.png";

export default function PromptCard({ title, _id }: IPrompt) {
  return (
    <Link
      to={`/chat/reply/${_id}`}
      className="flex size-full flex-1 gap-3 rounded-2xl border border-weak p-3 sm:min-w-83 sm:p-4"
    >
      <div className="flex size-[56px] items-center justify-center sm:size-[72px]">
        <img src={questionIcon} className="size-[36.32px] object-contain sm:size-[46.7px]" alt="Question" />
      </div>
      <div className="flex flex-1 flex-col justify-between gap-3">
        <span className="font-garamond text-base text-gray-950/90 sm:text-xl">{title}</span>
        <div className="flex items-center gap-[6px] text-sand-10">
          <span className="font-inter text-xs font-semibold">Continue</span>
          <span className="size-5 p-1">
            <LaunchIcon className="size-full" />
          </span>
        </div>
      </div>
    </Link>
  );
}

