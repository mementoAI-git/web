import { isEmpty } from "@/utility"
import { ReactNode } from "react"

interface IUserItem {
  name: string
  image?: string | ReactNode
  email: string
}
export default function UserItem({ email, image, name }: IUserItem) {
  return (
    <div className="flex items-center gap-3">
      <div className="size-10 bg-grey-500 rounded-full flex justify-center items-center">
        {
          image ??
          <span className="uppercase font-bold font-bricolage text-xl">{(isEmpty(name.trim()) ? email : name)[0]}</span>
        }
      </div>
      <div className="flex flex-col">
        <span className="text-secondary font-inter font-medium capitalize">{name}</span>
        <span className="font-inter text-[#535862]">{email}</span>
      </div>
    </div>
  )
}