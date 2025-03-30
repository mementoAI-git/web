import { bottomNavigations, topNavigations } from "./navigations";
import SideBarItem from "./SideBarItem";
import Logo from "@/components/Logo";

export function DashboardSideBar() {
  return (
    <div className="h-full border-r border-grey-500">
      <div className="h-full max-h-300 flex flex-col justify-between px-4 py-8">
        <div className="space-y-8">
          <Logo size={32} textClassName="!text-[24.24px]" />
          <div className="flex flex-col gap-2">
            {topNavigations.map((n, i) => <SideBarItem {...n} key={i} />)}
          </div>
        </div>
        <div>
          <div className="flex flex-col gap-2">
            {bottomNavigations.map((n, i) => <SideBarItem {...n} key={i} />)}
          </div>
        </div>
      </div>
    </div>
  )
}