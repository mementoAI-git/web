import endpoint from "@/api/endpoint";
import { ModalCloseBtn } from "@/components/ModalLayout";
import Spinner from "@/components/Spinner";
import useFetcher from "@/hooks/use-fetcher";
import { useModal } from "@/hooks/use-modal";
import { resolvePath } from "@/utility";
import { usePathname, useRouter } from "next/navigation";
import { mutate } from "swr";

export function DeleteMemory({ data: { memory } }) {
  const { trigger, isMutating } = useFetcher(resolvePath(endpoint.memory, { id: memory._id }), "delete")
  const { close } = useModal()
  const pathname = usePathname()
  const router = useRouter()

  const handleDelete = async () => {
    const result = await trigger({
      delete_permanently: memory && memory.status === "deleted"
    })
    if (result?.success) {
      if (pathname.includes(memory._id)) {
        router.push("/memories")
      }
      mutate((key) =>
        typeof key === 'string' &&
        key.startsWith(`${endpoint.stories}`));

      close("delete-memory")
    }
  }
  return (
    <div className="modal-container !max-w-120">
      <ModalCloseBtn onClick={() => close("delete-memory")} />
      <div className="space-y-6 mt-5">
        <div className="space-y-4">
          <h4 className="modal-title">Delete memory</h4>
          <span className="text-grey-600 text-sm font-inter">
            Are you sure you want to delete this post? This action cannot be undone.
          </span>
        </div>
        <div className="flex justify-end items-center gap-4">
          <button
            className="cursor-pointer px-4 py-2.5 bg-white/1 border border-[#0011661A] rounded-full h-10 font-inter font-semibold text-sm shadow"
            onClick={() => close("delete-memory")}
          >Cancel</button>
          <button
            disabled={isMutating}
            onClick={handleDelete}
            className=" flex px-4 py-2.5 items-center gap-2 justify-center cursor-pointer bg-danger text-white rounded-full h-10 font-inter font-semibold text-sm"
          >
            Yes, Delete
            <Spinner loading={isMutating} className="!size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}