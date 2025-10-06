import ArrowLeft from "@/public/icon/arrow-left.svg";
import { PropsWithChildren } from "react";
import AuthSocials from "./AuthSocials";
import Link from "next/link";

interface IAuthFormLayout extends PropsWithChildren {
  title: string;
  subtitle: React.ReactElement | string;
  footer?: React.ReactElement | string;
  can_go_back?: boolean;
  include_auth_socials?: boolean;
  icon?: React.ReactElement | null;
  className?: string;
}

export function AuthFormLayout({
  children,
  subtitle,
  title,
  footer = null,
  can_go_back = false,
  include_auth_socials = false,
  icon = null,
  className = "",
}: IAuthFormLayout) {
  return (
    <div
      className={`group mx-auto flex w-full h-fit max-w-[618px] flex-col justify-center gap-6 sm:gap-8 lg:gap-10 rounded-3xl bg-white p-4 sm:p-6 lg:p-10 ${className}`}
    >
      <div className="flex flex-col gap-3 sm:gap-4">
        {icon && (
          <div
            className={`flex aspect-square w-16 sm:w-18 lg:w-20 items-center justify-center rounded-full bg-primary/5 text-[#5F48D9] group-[.error]:bg-danger/5 group-[.error]:text-danger group-[.success]:bg-[#0ACC92]/5 group-[.success]:text-success`}
          >
            {icon}
          </div>
        )}
        <span className="font-canela text-3xl lg:leading-[38px] lg:text-[32px] text-gray-800">
          {title}
        </span>
        <span className="font-inter text-gray-600">
          {subtitle}
        </span>
      </div>

      <div className="flex flex-col gap-4 sm:gap-6">
        {children}
        {include_auth_socials && <AuthSocials />}
        {footer}
        {can_go_back && (
          <Link href="/login" className="text-center block w-full cursor-pointer gap-2">
            <span className="font-geist text-center text-xs sm:text-sm leading-5 font-bold text-grey-200 underline">
              Back to Login
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}
