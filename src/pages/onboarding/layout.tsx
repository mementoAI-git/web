import { useLayoutEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import AuthCheck from "@/components/layouts/auth-check";
import { useSkipOnboarding } from "./use-skip-onboarding";
import { cn } from "@/lib/utils";
import { OnboardingButton } from "./components/onboarding-card";
import { OnboardingHeaderSlot } from "./components/onboarding-header-slot";
import { onboardingAssets as assets } from "./assets";

export default function OnboardLayout() {
  const { pathname } = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [pathname]);
  const { skip, busy } = useSkipOnboarding();
  const [headerSlot, setHeaderSlot] = useState<HTMLDivElement | null>(null);
  const isWelcome =
    pathname === "/onboarding" ||
    pathname === "/onboarding/" ||
    pathname === "/onboarding/welcome";
  const isBeneficiary = pathname === "/onboarding/beneficiary";
  return (
    <div
      ref={scrollRef}
      className={cn(
        "flex h-dvh w-full flex-col overflow-y-auto bg-bg-neutral font-geist text-text-neutral-strong",
        !isBeneficiary && "onboarding-layout",
      )}
    >
      {!isWelcome && (
        <header className="relative flex h-[72px] shrink-0 items-center justify-end border-b border-stroke-neutral-weak px-4 md:h-[88px] md:justify-between md:px-10 md:pt-5 md:pb-[19px]">
          <Link
            to="/"
            className="max-md:hidden font-garamond text-[32px] font-medium leading-10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-stroke-brand-strong"
          >
            Memento.
          </Link>
          {/* Phones: the step dots sit in the middle of the header. */}
          <div
            ref={setHeaderSlot}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 md:hidden"
          />
          <OnboardingButton
            variant="outline"
            onClick={() => void skip()}
            disabled={busy}
            className="w-[119px] gap-1 px-0"
          >
            Skip
            <img
              src={assets["19031-32001/imgArrowNarrowRight"]}
              alt=""
              className="dark:invert"
            />
          </OnboardingButton>
        </header>
      )}
      <OnboardingHeaderSlot.Provider value={headerSlot}>
        <AuthCheck>
          <main
            className={cn(
              "flex w-full flex-1 justify-center px-4 py-8 sm:px-10",
              isWelcome ? "sm:py-16" : "sm:py-8",
              isWelcome ? "items-start" : "items-start md:items-center",
              isBeneficiary && "mx-auto max-w-[620px]",
            )}
          >
            <Outlet />
          </main>
        </AuthCheck>
      </OnboardingHeaderSlot.Provider>
    </div>
  );
}
