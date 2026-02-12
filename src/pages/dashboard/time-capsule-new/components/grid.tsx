"use client";

import { CalendarIcon } from "@/components/icons";
import ImageThumbnail from "@/components/image-thumbnail";
import type { ICapsule, IPagination } from "@/utility/interface";
import dayjs from "dayjs";
import { Link } from "react-router-dom";
import { CapsuleEmptyState } from "./CapsuleEmptyState";
import StatusBadge from "./StatusBadge";
import { CapsuleItemActions } from "./dropdown";
import { isImage } from "../utility/helpers";

function CapsuleGridItem({ capsule }: { capsule: ICapsule }) {
  return (
    <div className="flex min-h-[308px] w-full flex-col gap-3 sm:gap-4 rounded-xl sm:rounded-2xl bg-gray-200 p-0.5 sm:p4 border-gray-200 border hover:border-sand-8">
      <div className="h-[262px] bg-white rounded-xl p-2 flex flex-col">
        <div className="flex justify-between">
          <StatusBadge status={capsule.status || "draft"} />
          <div>
            <CapsuleItemActions capsule={capsule} />
          </div>
        </div>

        <span className="py-2 font-garamond font-medium text-xl leading-6 space-y-4">
          {capsule.title}
        </span>

        <p className="line-clamp-2 flex-1 border-t border-gray-50 pt2 text-xs">
          {capsule.body}
        </p>

        <div className="relative flex min-h-[50px] sm:min-h-[30px] overflow-hidden w-full items-center justify-start rounded-lg">
          {(() => {
            // Attachments from API are already the file objects
            const attachments = capsule?.attachments || [];

            if (attachments.length === 1 && isImage(attachments[0])) {
              return (
                <img
                  src={attachments[0].url}
                  alt={capsule.title}
                  className="object-cover w-full h-full"
                />
              );
            } else if (attachments.length > 0) {
              return (
                <Link to={`/capsules/${capsule?._id}`} className="size-fit">
                  <ImageThumbnail
                    images={attachments}
                    size={68.78}
                    boxClassName="!border-[2px] !rounded-[11.96px]"
                  />
                </Link>
              );
            } else {
              return (
                <div className="flex items-center w-full h-full text-gray-400">
                  <span className="text-sm">No Assets</span>
                </div>
              );
            }
          })()}
        </div>

        <div className="bg-gray-50 rounded-lg p-2 flex flex-col gap-1 mt-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-600">To:</span>
            <div className="flex items-center gap-1.5">
              {capsule.recipients.length > 0 ? (
                <>
                  {/* First recipient with avatar */}
                  <div className="flex items-center gap-1.5">
                    {capsule.recipients[0].picture_url ? (
                      <img
                        src={capsule.recipients[0].picture_url}
                        alt={
                          `${capsule.recipients[0].first_name} ${capsule.recipients[0].last_name}` ||
                          capsule.recipients[0].email
                        }
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                        {(
                          capsule.recipients[0].first_name ||
                          capsule.recipients[0].email
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-900">
                      {capsule.recipients[0].first_name ||
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

          <div className="flex justify-between text-xs">
            Due Date:
            <div className="flex items-center text-weak">
              <CalendarIcon width={16} height={16} />
              {dayjs(capsule.created_at).format("MMM DD, YYYY")}
            </div>
          </div>
        </div>
      </div>

      <div className="text-center text-sm font-inter text-gray-950">
        {capsule?.delivery_date
          ? dayjs(capsule.delivery_date).format("MMM D, YYYY")
          : "No date"}
        {capsule?.delivery_date &&
          dayjs(capsule.delivery_date).isAfter(dayjs()) && (
            <> • Due {dayjs(capsule.delivery_date).fromNow()}</>
          )}
        {capsule?.delivery_date &&
          dayjs(capsule.delivery_date).isBefore(dayjs()) && (
            <>
              {" "}
              • <span className="text-green-600">Delivered</span>
            </>
          )}
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

  console.log(data, "DATA");
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 auto-rows-fr">
      {data.docs.map((m, i) => (
        <CapsuleGridItem key={i} capsule={m} />
      ))}
    </div>
  );
}
