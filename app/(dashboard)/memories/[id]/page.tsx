import MemoryDetails from "@/views/Memories/MemoryDetails";
import MemoryDetailsSidebar from "@/views/Memories/MemoryDetailsSideBar";


export default function Memory({ params }) {
  return (
    <div className="flex">
      <div className="flex-1 max-w-207 p-8">
        <MemoryDetails />
      </div>
      <div className="max-w-[333px] w-[29%] shrink-0">
        <MemoryDetailsSidebar />
      </div>
    </div>
  )
}