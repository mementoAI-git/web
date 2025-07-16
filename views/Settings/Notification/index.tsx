import Switch from "@/components/Switch";

export function Notification() {
  return (
    <div className="space-y-10 max-w-140">
      <div className="space-y-2">
        <h4 className="text-secondary font-geist font-bold">Notifications</h4>
        <small className="text-sm font-geist text-grey-600">Setup and manage notifications</small>
      </div>
      <div className="space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[#000933A6] font-inter font-bold">Push notifications</span>
            <Switch />
          </div>
          <span className="text-[#000933A6] inline-block">Get notifications from Memento pushed to your device Lockscreen.</span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[#000933A6] font-inter font-bold">Email updates</span>
            <Switch />
          </div>
          <span className="text-[#000933A6] inline-block">Get notifications from Memento pushed to your device Lockscreen.</span>
        </div>
      </div>
    </div>
  )
}