import ArrowLeft from "@/public/icon/arrow-left.svg"
import { PropsWithChildren } from "react"
import AuthSocials from "./AuthSocials"
import Link from "next/link"

interface IAuthFormLayout extends PropsWithChildren {
  title: string
  subtitle: React.ReactElement | string
  can_go_back?: boolean
  include_auth_socials?: boolean
  icon?: React.ReactElement | null
  className?: string
}

export function AuthFormLayout({
  children,
  subtitle,
  title,
  can_go_back = false,
  include_auth_socials = false,
  icon = null,
  className = ""
}: IAuthFormLayout) {
  return (
    <div className={`flex flex-col justify-center w-full mx-auto bg-white max-w-[554px] p-10 gap-10 rounded-xl group ${className}`}>
      {
        can_go_back &&
        <Link href="/login" className="flex items-center gap-2 cursor-pointer">
          <ArrowLeft />
          <span className="font-geist text-sm font-bold leading-5 underline text-grey-200">Back to Login</span>
        </Link>
      }

      <div className="flex flex-col gap-4 text-center items-center justify-center">
        {
          icon &&
          <div className={`w-20 aspect-square bg-primary/5 text-[#5F48D9] group-[.error]:text-danger group-[.success]:text-success group-[.success]:bg-[#0ACC92]/5 group-[.error]:bg-danger/5 rounded-full flex justify-center  items-center`}>
            {icon}
          </div>
        }
        <span className="font-bricolage text-[32px] font-bold text-secondary">
          {title}
        </span>
        <span className="text-sm font-inter text-grey-200 px-5">
          {subtitle}
        </span>
      </div>

      <div className="flex flex-col gap-6">
        {include_auth_socials && <AuthSocials />}
        {children}
      </div>
    </div >
  )
}