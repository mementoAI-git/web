import Image from "next/image";
import careerImage from "@/public/image/image-6.png"
import { cn } from "@/utility";

interface ITopicProps {
  className?: string
  tag?: string
}

export default function Topic({ tag = "Question", className = "" }: ITopicProps) {
  return (
    <div className={cn("border border-sand-4 space-y-6 rounded-2xl w-full max-w-[270px] p-6 flex-shrink-0 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl hover:shadow-sand-4/20 hover:-translate-y-1 cursor-pointer", className)}>
      <div className="h-30 relative rounded-lg overflow-hidden">
        <div className="absolute top-2 left-2 rounded-full bg-gray-50 px-2 border border-gray-200">
          <span className="font-inter capitalize font-medium text-xs text-gray-700">{tag}</span>
        </div>
        <Image alt="" className="size-full object-cover transition-transform duration-300 ease-in-out hover:scale-110" src={careerImage} />
      </div>
      <div>
        <span className="font-georgia md:text-xl text-sand-12 font-normal">In what ways do your family or friends support you when you feel down?</span>
      </div>
    </div>
  )
}