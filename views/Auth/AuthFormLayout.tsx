import ArrowLeft from "@/public/icon/arrow-left.svg";
import { PropsWithChildren } from "react";
import AuthSocials from "./AuthSocials";
import Link from "next/link";

interface IAuthFormLayout extends PropsWithChildren {
  title: string;
  subtitle: React.ReactElement | string;
  can_go_back?: boolean;
  include_auth_socials?: boolean;
  icon?: React.ReactElement | null;
  className?: string;
}

export function AuthFormLayout({
  children,
  subtitle,
  title,
  can_go_back = false,
  include_auth_socials = false,
  icon = null,
  className = "",
}: IAuthFormLayout) {
  return (
    <div
      className={`group mx-auto flex w-full h-fit max-w-[554px] flex-col justify-center gap-6 sm:gap-8 lg:gap-10 rounded-xl bg-white p-4 sm:p-6 lg:p-10 ${className}`}
    >
      {can_go_back && (
        <Link href="/login" className="flex cursor-pointer items-center gap-2">
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="font-geist text-xs sm:text-sm leading-5 font-bold text-grey-200 underline">
            Back to Login
          </span>
        </Link>
      )}

      <div className="flex flex-col items-center justify-center gap-3 sm:gap-4 text-center">
        {icon && (
          <div
            className={`flex aspect-square w-16 sm:w-18 lg:w-20 items-center justify-center rounded-full bg-primary/5 text-[#5F48D9] group-[.error]:bg-danger/5 group-[.error]:text-danger group-[.success]:bg-[#0ACC92]/5 group-[.success]:text-success`}
          >
            {icon}
          </div>
        )}
        <span className="font-bricolage text-3xl lg:text-[32px] font-bold text-secondary">
          {title}
        </span>
        <span className="px-2 sm:px-5 font-inter text-sm text-grey-200">
          {subtitle}
        </span>
      </div>

      <div className="flex flex-col gap-4 sm:gap-6">
        {include_auth_socials && <AuthSocials />}
        {children}
      </div>
    </div>
  );
}
