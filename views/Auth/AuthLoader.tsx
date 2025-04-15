import Spinner from "@/components/Spinner"

export function AuthLoader({ title }: { title: string }) {
  return (
    <div className="flex flex-col justify-center items-center w-full mx-auto bg-white max-w-[554px] min-h-100 p-10 gap-10 rounded-xl">
      <Spinner loading className="!size-20 !text-secondary" />
      <span className="text-2xl text-center">{title}</span>
    </div>
  )
}