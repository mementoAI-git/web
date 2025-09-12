import { useRouter } from "next/navigation"
import ArrowLeftIcon from "@/public/icon/arrow-left.svg"

export default function GoBack() {
  const router = useRouter()
  return (
    <button
      onClick={router.back}
      className="text-sand-10 cursor-pointer hover:scale-95 flex gap-1.5 items-center rounded-full bg-sand-3 text-sm font-medium font-inter py-2.5 px-3.5"
    >
      <ArrowLeftIcon className="text-lg size-3 stroke-2" />
      <span>Go back</span>
    </button>
  )
}