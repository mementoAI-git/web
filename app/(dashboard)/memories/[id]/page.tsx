import MemoryDetails from "@/views/Memories/MemoryDetails";
import MemoryDetailsSidebar from "@/views/Memories/MemoryDetailsSideBar";

export default function Memory({ params }) {
  return (
    <div className="flex">
      <div className="max-w-207 flex-1 p-8">
        <MemoryDetails />
      </div>
      <div className="w-[29%] max-w-[333px] shrink-0">
        <MemoryDetailsSidebar />
      </div>
    </div>
  );
}
