import Switch from "@/components/Switch";

export default function BackgroundMusic() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-medium text-secondary text-xl">Background Music</span>
        <Switch />
      </div>
      <div className="w-full bg-[#E9EAEB] h-2 rounded-full">
        <div className="w-1/2 bg-[#DCC7FF] h-full rounded-full relative">
          <div className="bg-white cursor-pointer absolute right-0 top-1/2 -translate-y-1/2 size-6 rounded-full border-[1.5px] border-primary" />
        </div>
      </div>
    </div>
  )
}