import { Searchinput } from "@/components/Form";
import { useUser } from "@/hooks/use-fetcher";
import { ReactNode } from "react";

export function DashboardHeader({ start }: { start?: ReactNode }) {
  const { data } = useUser()
  return (
    <div className="w-full border-b border-grey-500">
      <header className="mx-auto flex max-h-23 w-[93%] items-center gap-6 py-6">
        {
          start &&
          <div className="shrink-0">
            {start}
          </div>
        }
        <div className="h-10 flex-1">
          <Searchinput />
        </div>
        <div className="flex max-h-10 shrink-0 items-center gap-4 font-inter">
          <div className="h-full cursor-pointer space-x-1 rounded-full bg-grey-400 px-5 py-2">
            <span>✌🏾</span>
            <span className="font-semibold text-grey-600">{data?.data?.streak || 0}</span>
          </div>
          <div className="h-full cursor-pointer rounded-full border border-[rgba(199,201,200,1)] px-5 py-2">
            <span className="font-semibold text-grey-600">Invite friends</span>
          </div>
          <div className="h-full cursor-pointer rounded-full border border-[rgba(199,201,200,1)] px-5 py-2">
            <span className="font-semibold text-grey-600">Help</span>
          </div>
        </div>
      </header>
    </div>
  );
}
