import type { PropsWithChildren, ReactElement } from "react";
import { Link } from "react-router-dom";
import bg5 from "@/assets/image/bg/5.png"
import Logo from "@/components/logo";
import AuthSocials from "./auth-social";

interface IAuthFormLayout extends PropsWithChildren {
  title: string;
  subtitle: ReactElement | string;
  footer?: ReactElement | string | null;
  can_go_back?: boolean;
  include_auth_socials?: boolean;
  icon?: ReactElement | null;
  className?: string;
}

export default function AuthLayout({
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
    <div className="min-h-screen h-[90%] relative">
      <img
        src={bg5}
        alt="Cloudy BG"
        className="absolute size-full object-cover top-0 bottom-0 left-0 right-0 mx-auto "
      />
      <div className="size-full z-auto absolute top-0 left-0 right-0 bottom-0">
        <header className="flex mx-auto w-full max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-20 py-4 sm:py-6">
          <Logo />
        </header>
        <div className="size-full overflow-y-auto hide-scrollbar px-4 sm:px-6 lg:px-20 z-auto py-8 sm:py-12 lg:py-20">
          <main className="mx-auto w-full max-w-[1440px]">
            <div
              className={`group mx-auto flex h-fit w-full max-w-[618px] flex-col justify-center gap-6 rounded-3xl bg-white p-6 sm:gap-8 lg:gap-10 lg:p-10 ${className}`}
            >
              <div className="flex flex-col gap-3 sm:gap-4">
                {icon && (
                  <div className="flex aspect-square w-16 items-center justify-center rounded-full bg-primary/5 text-[#5F48D9] group-[.error]:bg-danger/5 group-[.error]:text-danger group-[.success]:bg-[#0ACC92]/5 group-[.success]:text-success sm:w-18 lg:w-20">
                    {icon}
                  </div>
                )}
                <span className="font-garamond font-medium text-3xl text-gray-800 lg:text-[32px] lg:leading-[38px]">
                  {title}
                </span>
                <span className="font-inter text-gray-600">{subtitle}</span>
              </div>

              <div className="flex flex-col gap-4 sm:gap-6">
                {children}
                {include_auth_socials && <AuthSocials />}
                {footer}
                {can_go_back && (
                  <Link to="/login" className="block w-full cursor-pointer gap-2 text-center">
                    <span className="font-geist text-center text-xs font-bold leading-5 text-grey-200 underline sm:text-sm">
                      Back to Login
                    </span>
                  </Link>
                )}
              </div>
            </div>
          </main>
          <div className="w-full h-30" />
        </div>
      </div>
    </div >
  );
}

