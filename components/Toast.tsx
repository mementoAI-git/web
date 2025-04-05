import CirclCheckIcon from "@/public/icon/circle-check.svg"
import TimesIcon from "@/public/icon/times.svg"
import { ToastContentProps } from "react-toastify"

interface IToastData {
  title: string
  subtitle: string
}

export default function Toast({ closeToast, data, toastProps }: ToastContentProps<IToastData>) {
  return (
    <div className="max-w-[596px] max-h-[108px] bg-[rgba(10,204,146,0.05)] mx-auto overflow-hidden rounded-lg border-l-0 border border-success/20">
      <div className="w-full flex gap-3 items-start border-l-3 border-success/80 p-6">
        <div className="text-success mt-1">
          {
            toastProps.type === "success" ?
              <CirclCheckIcon width={22} /> :
              <CirclCheckIcon width={22} />
          }
        </div>
        <div>
          <div className="flex items-center justify-between">
            <span className="font-inter font-semibold text-xl">{data?.title}</span>
            <div className="text-grey-300 size-6 flex items-center justify-center">
              <TimesIcon />
            </div>
          </div>
          <span className="font-inter font-normal text-grey-200">{data?.subtitle}</span>
        </div>
      </div>
    </div>
  )
}