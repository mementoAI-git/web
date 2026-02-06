"use client";

import { CalendarIcon } from "@/components/icons";
import ImageThumbnail from "@/components/image-thumbnail";
// import { MemoryItemActions } from "./dropdown";
import type { ICapsule, IPagination } from "@/utility/interface";
import dayjs from "dayjs";
import { Link } from "react-router-dom";
import { CapsuleEmptyState } from "./CapsuleEmptyState";
import StatusBadge from "./StatusBadge";
import { CapsuleItemActions } from "./dropdown";

// function CapsuleGridItem({ memory }: { memory: IMemory }) {
//   const [isHovered, setIsHovered] = useState(false);

//   return (
//     <div className="flex min-h-[250px] w-full flex-col gap-3 sm:gap-4 rounded-xl sm:rounded-2xl bg-sand-1 p-4 sm:p-6 border-gray-200 border hover:border-sand-8">
//       <div
//         className="relative flex h-[120px] sm:h-[138px] overflow-hidden w-full items-center justify-center rounded-lg bg-[#F3F3F3]"
//         onMouseEnter={() => setIsHovered(true)}
//         onMouseLeave={() => setIsHovered(false)}
//       >
//         {memory?.attachments?.length === 1 &&
//         memory?.attachments[0]?.type?.includes("image") ? (
//           <img
//             src={memory?.attachments[0].url}
//             alt={memory.title}
//             className="object-cover w-full h-full"
//           />
//         ) : memory?.attachments?.length > 0 ? (
//           <Link to={`/capsules/${memory?._id}`} className="size-fit">
//             <ImageThumbnail
//               images={memory?.attachments}
//               size={68.78}
//               boxClassName="!border-[2px] !rounded-[11.96px]"
//             />
//           </Link>
//         ) : (
//           // Placeholder for capsules without attachments
//           <div className="flex items-center justify-center w-full h-full text-gray-400">
//             <span className="text-sm">No images</span>
//           </div>
//         )}
//         {isHovered && (
//           <div className="absolute top-4 right-4 bg-white rounded-md shadow-md">
//             <MemoryItemActions memory={memory} />
//           </div>
//         )}
//       </div>

//       <div className="flex flex-col gap-2 sm:gap-3 flex-1">
//         {/* Delivery date instead of created date? */}
//         <div className="flex items-center gap-1">
//           <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5" />
//           <span className="font-inter text-xs sm:text-sm text-[#949494]">
//             Delivers: {dayjs(memory.delivery_date).format("MMM DD, YYYY")}
//           </span>
//         </div>

//         <Link
//           to={`/capsules/${memory?._id}`}
//           className="truncate cursor-pointer font-inter font-semibold text-sm sm:text-base text-[#050709] line-clamp-2"
//         >
//           {memory.title}
//         </Link>

//         {/* Show recipients instead of tags */}
//         <div className="flex items-end justify-between text-[#949494] mt-auto">
//           <div className="flex flex-wrap items-center gap-1 sm:gap-2">
//             {memory.recipients?.slice(0, 3).map((recipient, i) => (
//               <span
//                 key={i}
//                 className="rounded-full px-1 sm:px-1.5 py-0.5 font-inter text-xs sm:text-sm border border-[#D7DDF9] bg-[#EAECFC] text-[#4863E3]"
//               >
//                 {recipient.email}
//               </span>
//             ))}
//             {memory.recipients && memory.recipients.length > 3 && (
//               <span className="mem-tags text-xs sm:text-sm">
//                 +{memory.recipients.length - 3}
//               </span>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
//

function CapsuleGridItem({ capsule }: { capsule: ICapsule }) {
  return (
    <div className="flex min-h-[308px] w-full flex-col gap-3 sm:gap-4 rounded-xl sm:rounded-2xl bg-gray-200 p-0.5 sm:p4 border-gray-200 border hover:border-sand-8">
      <div className="h-[262px] bg-white rounded-xl p-2 flex flex-col gap3">
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

        <div className="border-t border-gray-50 pt-2 pb-3">{capsule.body}</div>

        <div className="relative flex h-[120px] sm:h-[138px] overflow-hidden w-full items-center justify-center rounded-lg bg-[#F3F3F3]">
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
        </div>

        <div className="bg-gray-50 rounded-lg p-2 flex flex-col gap-1 mt-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">To:</span>
            <div className="flex items-center gap-1.5">
              {capsule.recipients.length > 0 ? (
                <>
                  {/* First recipient with avatar */}
                  <div className="flex items-center gap-1.5">
                    {capsule.recipients[0].user?.picture_url ? (
                      <img
                        src={capsule.recipients[0].user.picture_url}
                        alt={
                          capsule.recipients[0].name ||
                          capsule.recipients[0].email
                        }
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                        {(
                          capsule.recipients[0].name ||
                          capsule.recipients[0].email
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-900">
                      {capsule.recipients[0].name ||
                        capsule.recipients[0].email.split("@")[0]}
                    </span>
                  </div>

                  {/* Additional recipients count */}
                  {capsule.recipients.length > 1 && (
                    <span className="text-sm text-gray-500">
                      +{capsule.recipients.length - 1} other
                      {capsule.recipients.length > 2 ? "s" : ""}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-sm text-gray-400 italic">
                  No recipients
                </span>
              )}
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
      <div className="text-center text-sm font-inter text-gray-950">
        Due in: {dayjs(capsule.delivery_date).fromNow()}
      </div>
    </div>
  );
}

export default function CapsuleGrid({
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 auto-rows-fr">
      {data.docs.map((m, i) => (
        <CapsuleGridItem key={i} capsule={m} />
      ))}
    </div>
  );
}
