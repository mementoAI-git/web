import { Link } from "react-router-dom";
import questionImage from "@/assets/image/question-2.png";

interface CategoryPromptCardProps {
  title: string;
  _id: string;
}

export default function CategoryPromptCard({ title, _id }: CategoryPromptCardProps) {
  return (
    <Link
      to={`/chat/reply/${_id}`}
      className="flex w-full flex-col items-start gap-4 rounded-2xl border border-sand-4 bg-sand-2 p-6 sm:flex-row sm:items-center sm:gap-10"
    >
      <div className="flex w-full items-start justify-between sm:w-fit">
        <div className="flex size-18 shrink-0 items-center justify-center p-0 sm:size-37 sm:p-6">
          <img className="size-full shrink-0 object-contain" alt="Question icon" src={questionImage} />
        </div>
        <span className="inline-block rounded-full bg-sand-4 py-0.5 px-2.5 text-center font-inter text-xs font-medium text-gray-700 sm:hidden">
          Question
        </span>
      </div>
      <div className="space-y-2 sm:space-y-4">
        <button className="hidden cursor-pointer items-center gap-[6px] rounded-full border-[1.5px] border-sand-10 px-3 py-1 text-xs text-sand-10 transition hover:scale-[97%] sm:flex sm:text-sm">
          Question
        </button>
        <h3 className="font-garamond text-sand-12 md:text-2xl">{title}</h3>
        <Link
          to={`/chat/reply/${_id}`}
          className="inline-block cursor-pointer rounded-full border border-[#84663366] bg-transparent px-4 py-2 transition hover:scale-[95%] sm:py-2"
        >
          <span className="text-sm font-semibold text-sand-10">Reply question</span>
        </Link>
      </div>
    </Link>
  );
}
