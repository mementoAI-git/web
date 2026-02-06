import type { IPagination, ICapsule } from "@/utility/interface";
import { CapsuleEmptyState } from "./CapsuleEmptyState";
import { CalendarIcon } from "@/components/icons";
import ImageThumbnail from "./ImageThumbnail";
import { Link } from "react-router-dom";
import { DotsVerticalIcon } from "./icons/DotsVerticalIcon";
import StatusBadge from "./StatusBadge";
import { useState } from "react";
import dayjs from "dayjs";
import { CapsuleItemActions } from "./dropdown";

function CapsuleListItem({ capsule }: { capsule: ICapsule }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="flex min-h-60 w-full flex-col gap-3 sm:gap-4 rounded-xl sm:rounded-2xl bg-gray-200 p-0.5 sm:p4 border-gray-200 border hover:border-sand-8">
      <div className=" bg-white rounded-xl p-2 flex  gap-4">
        <div
          className="relative  flex h-[120px] sm:h-[138px] overflow-hidden w-40 items-center justify-center rounded-lg bg-[#F3F3F3]"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {capsule?.attachments?.length === 1 &&
          capsule?.attachments[0]?.type?.includes("image") ? (
            <img
              src={capsule?.attachments[0].url}
              alt={capsule.title}
              className="object-cover w-full h-full"
            />
          ) : capsule?.attachments?.length > 0 ? (
            <Link to={`/capsules/${capsule?._id}`} className="size-fit">
              <ImageThumbnail
                images={capsule?.attachments}
                size={68.78}
                boxClassName="!border-[2px] !rounded-[11.96px]"
              />
            </Link>
          ) : (
            // Placeholder for capsules without attachments
            <div className="flex items-center justify-center w-full h-full text-gray-400">
              <span className="text-sm">No images</span>
            </div>
          )}

          {/*{isHovered && (
            <div className="absolute top-4 right-4 bg-white rounded-md shadow-md">
              <capsuleItemActions memory={memory} />
            </div>
          )}*/}
        </div>

        <div className="flex-1">
          <div className="flex justify-between">
            <StatusBadge status={capsule.status || "draft"} />
            <div>
              {/*<DotsVerticalIcon width={20} height={20} />*/}
              <CapsuleItemActions capsule={capsule} />
            </div>
          </div>

          <span className="py-2 font-garamond font-medium text-xl leading-6 space-y-4">
            {capsule.title}
          </span>

          <div className="border-t border-gray-50 pt-2 pb-3">
            {capsule.body}
          </div>

          <div className="bg-gray-50 rounded-lg p-2 flex flex-col gap-1 mt-3">
            <div className="flex justify-between">
              To:
              <div>
                {/*<img src={memory.recipients[0]}></img>*/}
                {capsule.recipients[0].email}
              </div>
            </div>

            <div className="flex justify-between">
              Due Date:
              <div className="flex items-center text-weak">
                <CalendarIcon width={16} height={16} />
                {dayjs(capsule.created_at).format("MMM DD, YYYY")}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="text-center text-sm font-inter text-gray-950">
        Due in: {dayjs(capsule.delivery_date).fromNow()}
      </div>
    </div>
  );
}

// export default function CapsuleList({ data }: { data: IPagination<IMemory> }) {
//   // Handle empty state
//   if (!data?.docs || data.docs.length === 0) {
//     return <CapsuleEmptyState />;
//   }

//   return (
//     <div className="grid grid-cols-1 gap-4 sm:gap-6 auto-rows-fr">
//       {data.docs.map((m, i) => (
//         <CapsuleListItem key={i} capsule={m} />
//       ))}
//     </div>
//   );
// }

export default function CapsuleList({
  data,
  filter = "all",
}: {
  data: IPagination<ICapsule>;
  filter?: string;
}) {
  // Handle empty state
  if (!data?.docs || data.docs.length === 0) {
    return <CapsuleEmptyState filterType={filter} showCreateButton={true} />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-6 auto-rows-fr">
      {data.docs.map((m, i) => (
        <CapsuleListItem key={i} capsule={m} />
      ))}
    </div>
  );
}

// <>
//   {!data?.data?.docs || data?.data?.docs.length === 0 ? (
//     <CapsuleEmptyState showCreateButton={true} />
//   ) : (
//     <div className="w-full overflow-x-auto">
//       <Table
//         data={data?.data?.docs}
//         columns={columns}
//         loading={isLoading}
//         loadingRow={<TableRowSekeleton />}
//         onChangePage={setPage}
//         renderRow={(r, i) => (
//           <StoriesTableRow key={i} memory={r as IMemory} />
//         )}
//         emptyRow={<TableEmptyState />}
//       />
//     </div>
//   )}
// </>
