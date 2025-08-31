import { cn } from "@/utility"
import careerImage from "@/public/image/image-6.png"
import Image from "next/image"

export default function Bubble({ role = "user", text = "" }) {
  const isUser = role === "user"
  return (
    <div className="space-y-1">
      {
        isUser &&
        <div className="bg-sand-3 ml-auto px-4 py-3 rounded-xl flex gap-2 w-full md:w-fit max-w-[520px]">
          {
            Array.from({ length: 3 }).map((_, i) => (
              <Image
                src={careerImage}
                className="max-w-[148px] shrink flex-1 rounded-lg max-h-[99px] h-auto object-cover"
                alt="Career"
                key={i}
              />
            ))
          }
        </div>
      }
      <div
        className={cn("w-full py-3", {
          "ml-auto bg-sand-3 px-4 max-w-[520px] rounded-xl": isUser
        })}
      >
        <span className="font-georgia text-sand-12 ">
          {text}
        </span>
      </div>
    </div>
  )
}