import { usePrompt } from "@/hooks/use-prompt"
import confetti from "@/public/image/confetti.png"
import Image from "next/image";

export default function SharePost() {
  const { navigations } = usePrompt()
  if (navigations[0] !== "share") return;
  return (
    <div className="space-y-6">
      <Image className="mx-auto object-contain size-16" src={confetti} alt="confetti" />
      <div className="flex flex-col justify-center text-center gap-3">
        <span className="font-inter text-3xl font-semibold text-secondary">New Post added</span>
        <span className="text-sm text-grey-600 text-center font-inter">You have saved a new entry to memento</span>
      </div>
      <div className="bg-[rgba(252,252,253,1)] space-y-4 border border-[rgba(249,249,249,1)] rounded-2xl p-4">
        <div>
          <span className="text-sm text-grey-600 font-medium">Share link</span>
          <div className="bg-white border rounded-lg border-[rgba(213,215,218,1)] h-10 w-full flex">
            <span className="flex-1 px-3 flex h-full items-center border-r border-inherit text-grey-600">www.memento.io/post/73f9320d</span>
            <span className="px-3.5 items-center flex cursor-pointer">Copy</span>
          </div>
        </div>
        <div className="flex justify-center items-center gap-11">
          <div className="size-11 rounded-full bg-grey-500 flex items-center justify-center"></div>
          <div className="size-11 rounded-full bg-grey-500 flex items-center justify-center"></div>
          <div className="size-11 rounded-full bg-grey-500 flex items-center justify-center"></div>
        </div>
      </div>
      <div className="flex gap-4">
        <button className="btn flex-1">Add another entry</button>
        <button className="btn flex-1 !text-secondary !bg-grey-400">Dismiss</button>
      </div>
    </div>
  )
}