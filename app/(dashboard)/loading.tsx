import Spinner from "@/components/Spinner";

export default function Loading() {
  return (
    <div className="size-full min-h-screen flex justify-center items-center">
      <Spinner loading className="!size-30 !text-secondary" />
    </div>
  )
}