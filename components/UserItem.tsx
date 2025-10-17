import { cn, isEmpty } from "@/utility"
import { ReactNode } from "react"

interface IUserItem {
  name: string
  image?: string | ReactNode
  email: string
  imageClassName?: string
}
export default function UserItem({ email, image, name, imageClassName = "" }: IUserItem) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn("size-10 bg-grey-500 rounded-full flex justify-center items-center text-xl", imageClassName)}>
        {
          image ??
          <span className="uppercase font-bold font-bricolage">
            {(isEmpty(name.trim()) ? email : name)[0]}
          </span>
        }
      </div>
      <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
        <span className="text-secondary font-inter font-medium capitalize block truncate">{name}</span>
        <span className="font-inter text-[#535862] block truncate">{email}</span>
      </div>
    </div>
  )
}