import type { IPagination, ICapsule } from "@/utility/interface";
import { CapsuleEmptyState } from "./CapsuleEmptyState";
import ImageThumbnail from "./ImageThumbnail";
import StatusBadge from "./StatusBadge";
import dayjs from "dayjs";
import { CapsuleItemActions } from "./dropdown";
import { CalendarIcon } from "@/components/icons";

function CapsuleListItem({ capsule }: { capsule: ICapsule }) {
  return (
    <div className="flex  w-full flex-col gap-2 sm:gap-3 rounded-xl sm:rounded-2xl bg-gray-200 p-0.5 sm:p4 border-gray-200 border hover:border-sand-8">
      <div className=" bg-white rounded-xl p-2 flex  gap-4">
        <div className="relative  flex h-[120px] sm:h-[138px] overflow-hidden w-40 items-center justify-center rounded-lg bg-[#F3F3F3]">
          {(() => {
            const directAttachments = capsule?.attachments || [];
            const memoryAttachments =
              capsule.memories?.flatMap((m) => m.attachments || []) || [];

            // Combine and get unique attachments by ID/URL
            const combined = [...directAttachments, ...memoryAttachments];
            const uniqueAttachments = Array.from(
              new Map(
                combined.map((item) => [item._id || item.url, item]),
              ).values(),
            );

            if (uniqueAttachments.length > 0) {
              return <ImageThumbnail images={uniqueAttachments} single />;
            } else {
              return (
                <div className="flex py-20 items-center w-full h-full text-gray-400">
                  <span className="text-sm">No Assets</span>
                </div>
              );
            }
          })()}
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="flex justify-between">
            <StatusBadge status={capsule.status || "draft"} />
            <div>
              <CapsuleItemActions capsule={capsule} />
            </div>
          </div>
          <span className="py-2 font-garamond font-medium text-xl leading-6 space-y-4">
            {capsule.title}
          </span>
          <p className="line-clamp-2 border-t border-gray-50 pt-2 text-xs">
            {capsule.body}
          </p>
          <div className="bg-gray-50 rounded-lg p-2 flex flex-col gap-1 mt-3">
            <div className="flex justify-between text-xs">
              To:
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
                {capsule.schedule_date
                  ? dayjs(capsule.schedule_date).format("MMM DD, YYYY")
                  : "No date"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center  py-3 text-sm font-inter text-gray950">
        {(() => {
          // Draft - no schedule date
          if (capsule.status === "draft" || !capsule?.schedule_date) {
            return "Due in: Undefined";
          }

          // Delivered - backend status or date in the past
          if (
            capsule.status === "delivered" ||
            (capsule.schedule_date &&
              dayjs(capsule.schedule_date).isBefore(dayjs()))
          ) {
            return "Delivered";
          }

          // Scheduled - schedule date is in the future
          const now = dayjs();
          const scheduleDate = dayjs(capsule.schedule_date);
          const diffInHours = scheduleDate.diff(now, "hour");

          // Less than 24 hours - show hours and minutes
          if (diffInHours < 24) {
            const hours = scheduleDate.diff(now, "hour");
            const minutes = scheduleDate.diff(now.add(hours, "hour"), "minute");

            const parts = [];
            if (hours > 0) parts.push(`${hours} hour${hours > 1 ? "s" : ""}`);
            if (minutes > 0 || hours === 0)
              parts.push(`${minutes} minute${minutes > 1 ? "s" : ""}`);

            return `Due in: ${parts.join(", ")}`;
          }

          // More than 24 hours - show years, months, days
          const years = scheduleDate.diff(now, "year");
          const months = scheduleDate.diff(now.add(years, "year"), "month");
          const days = scheduleDate.diff(
            now.add(years, "year").add(months, "month"),
            "day",
          );

          // Build the time string
          const parts = [];
          if (years > 0) parts.push(`${years} year${years > 1 ? "s" : ""}`);
          if (months > 0) parts.push(`${months} month${months > 1 ? "s" : ""}`);
          if (days > 0 && years === 0)
            parts.push(`${days} day${days > 1 ? "s" : ""}`); // Only show days if less than a year

          return `Due in: ${parts.join(", ") || "0 days"}`;
        })()}
      </div>
    </div>
  );
}

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
