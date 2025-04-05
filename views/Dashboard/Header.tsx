import { Searchinput } from "@/components/Form";

export function DashboardHeader() {
  return (
    <div className="w-full border-b border-grey-500">
      <header className="flex items-center w-[93%] mx-auto py-6 max-h-23  gap-6">
        <div className="shrink-0">
          <span className="fon font-bricolage font-medium text-4xl leading-11 tracking-[-2%] text-grey-900">My memories</span>
        </div>
        <div className="flex-1 h-10">
          <Searchinput />
        </div>
        <div className="gap-4 flex max-h-10 items-center shrink-0 font-inter">
          <div className="h-full rounded-full space-x-1 py-2 px-5 bg-grey-400 cursor-pointer">
            <span>✌🏾</span>
            <span className="font-semibold text-grey-600">5</span>
          </div>
          <div className="border rounded-full h-full py-2 px-5 border-[rgba(199,201,200,1)] cursor-pointer">
            <span className="font-semibold text-grey-600">Invite friends</span>
          </div>
          <div className="border rounded-full h-full py-2 px-5 border-[rgba(199,201,200,1)] cursor-pointer">
            <span className="font-semibold text-grey-600">Help</span>
          </div>
        </div>
      </header>
    </div>
  )
}