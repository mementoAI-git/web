import type { PropsWithChildren, ReactElement } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { AuthCenteredSplitShell } from "@/components/auth-split-layout";
import { cn } from "@/lib/utils";
import AuthSocials from "./auth-social";

export interface AuthFormPanelProps extends PropsWithChildren {
  title: string;
  subtitle?: ReactElement | string | null;
  footer?: ReactElement | string | null;
  can_go_back?: boolean;
  include_auth_socials?: boolean;
  /** When true, omit the rule row above OAuth (e.g. login already has an “or” divider above passkey). */
  hide_auth_socials_divider?: boolean;
  icon?: ReactElement | null;
  className?: string;
}

/** Right-column auth content only (no outer shell). Use inside {@link AuthCenteredSplitShell} or {@link AuthSplitShell} when the shell is already provided. */
export function AuthFormPanel({
  children,
  subtitle,
  title,
  footer = null,
  can_go_back = false,
  include_auth_socials = false,
  hide_auth_socials_divider = false,
  icon = null,
  className = "",
}: AuthFormPanelProps) {
  return (
    <div className={cn("group/auth-root box-content flex w-full flex-col gap-5 px-0.5 sm:gap-5", className)}>
      {can_go_back ?
        <Link
          to="/login"
          className="inline-flex w-fit items-center gap-1.5 font-inter text-xs font-medium text-v3-text-weak transition-colors hover:text-v3-text-strong sm:text-sm"
        >
          <ArrowLeft className="size-3.5 shrink-0 sm:size-4" strokeWidth={2} aria-hidden />
          Back to login
        </Link>
      : null}

      {icon ?
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:size-14",
            "group-[.error]/auth-root:bg-[var(--red-50)] group-[.error]/auth-root:text-[var(--red-1000)]",
            "group-[.success]/auth-root:bg-[var(--green-50)] group-[.success]/auth-root:text-[var(--green-1000)]",
          )}
        >
          {icon}
        </div>
      : null}

      <header className="flex flex-col gap-1.5 sm:gap-2">
        <h1 className="font-garamond text-[1.625rem] font-normal leading-[32px] text-v3-text-strong sm:text-[1.875rem] lg:text-[1.75rem]">
          {title}
        </h1>
        {subtitle ?
          <p className="font-inter text-xs leading-relaxed text-v3-text-weak">{subtitle}</p>
        : null}
      </header>

      {include_auth_socials ?
        <AuthSocials showDivider={!hide_auth_socials_divider} />
      : null}

      <div className="box-content flex flex-col gap-4 sm:gap-5">
        {children}
        {footer ?
          <div className="flex items-center justify-center gap-2 text-center font-inter text-xs text-v3-text-weak sm:text-sm">
            {footer}
          </div>
        : null}
      </div>
    </div>
  );
}

export default function AuthLayout(props: AuthFormPanelProps) {
  return (
    <AuthCenteredSplitShell>
      <AuthFormPanel {...props} />
    </AuthCenteredSplitShell>
  );
}
