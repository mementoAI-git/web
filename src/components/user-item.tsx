import type { ReactNode } from "react";
import { cn, isEmpty } from "@/utility";

interface UserItemProps {
  name: string;
  image?: string | ReactNode;
  email: string;
  imageClassName?: string;
}

export default function UserItem({ email, image, name, imageClassName = "" }: UserItemProps) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn("flex size-10 items-center justify-center rounded-full bg-grey-500 text-xl", imageClassName)}>
        {image ?? (
          <span className="font-inter font-bold uppercase">
            {(isEmpty(name.trim()) ? email : name)[0]}
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <span className="block truncate font-inter font-medium capitalize text-secondary">{name}</span>
        <span className="block truncate font-inter text-[#535862]">{email}</span>
      </div>
    </div>
  );
}
