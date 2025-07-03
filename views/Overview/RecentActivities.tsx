import QIcon from "@/public/icon/q.svg"
import useSWR from "swr"
import endpoint from "@/api/endpoint";
import { formattedDate, isEmpty } from "@/utility";

export default function RecentActivities() {
  const { data, isLoading } = useSWR(endpoint.activities)

  return (
    <div className="flex-1 w-full rounded-2xl bg-grey-700 space-y-4 sm:space-y-6 py-4 sm:py-8 min-h-72.5">
      <div className="flex items-center justify-between px-4 sm:px-8">
        <span className="font-inter text-xs font-medium text-grey-800">
          RECENT ACTIVITIES
        </span>
        <span className="cursor-pointer text-xs sm:text-sm font-semibold text-grey-600">
          See all
        </span>
      </div>
      <div className="w-full px-4 sm:px-8 font-inter space-y-3 sm:space-y-4">
        {
          isLoading ?
            <div className="flex items-center justify-center w-full h-full">
              <span className="text-xs text-grey-800 leading-4.5">Loading...</span>
            </div>
            :
            isEmpty(data?.data?.docs) ?
              <div className="flex items-center justify-center w-full h-full">
                <span className="text-xs text-grey-800 leading-4.5">No activities found</span>
              </div> :
              data?.data?.docs?.map((activity, i) => (
                <div key={i} className="flex gap-2 sm:gap-3 w-full">
                  <div className="bg-[#EBEBEB] shrink-0 rounded-sm size-6 flex items-center justify-center">
                    <QIcon width={10} height={13} />
                  </div>
                  <div className="flex flex-col w-full">
                    <span className="text-xs sm:text-sm text-grey-600 leading-5 whitespace-nowrap truncate w-full font-medium">
                      {activity?.description}
                    </span>
                    <span className="text-xs text-grey-800 leading-4.5">
                      {formattedDate(activity?.createdAt)}
                    </span>
                  </div>
                </div>
              ))
        }
      </div>
    </div>
  );
}
