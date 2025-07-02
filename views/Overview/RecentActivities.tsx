import QIcon from "@/public/icon/q.svg"

export default function RecentActivities() {
  return (
    <div className="w-full sm:max-w-[335px] rounded-2xl bg-grey-700 space-y-4 sm:space-y-6 py-4 sm:py-8">
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
          [1, 2, 4, 5, 6].map(i => (
            <div key={i} className="flex gap-2 sm:gap-3 w-full">
              <div className="bg-[#EBEBEB] shrink-0 rounded-sm size-6 flex items-center justify-center">
                <QIcon width={10} height={13} />
              </div>
              <div className="flex flex-col w-full">
                <span className="text-xs sm:text-sm text-grey-600 leading-5 whitespace-nowrap truncate w-full font-medium">
                  What is one of your earliest child
                </span>
                <span className="text-xs text-grey-800 leading-4.5">Yesterday 15:34 PM</span>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}
