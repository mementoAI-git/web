import AuthCheck from "@/components/layouts/auth-check";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import Logo from "@/components/logo";
import { useStore } from "@/hooks/use-store";
import { cn } from "@/lib/utils";

export default function OnboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const { user, setUser } = useStore();
  const isSummaryRoute =
    location.pathname === "/onboarding/summary" ||
    location.pathname.startsWith("/onboarding/summary?");
  const isWelcomeRoute =
    location.pathname === "/onboarding/welcome" ||
    location.pathname.startsWith("/onboarding/welcome?");
  const isNicknameRoute =
    location.pathname === "/onboarding/nickname" ||
    location.pathname.startsWith("/onboarding/nickname?");
  const isMiscRoute =
    location.pathname === "/onboarding/misc" ||
    location.pathname.startsWith("/onboarding/misc?");

  const handleSkip = () => {
    try {
      if (user && setUser) {
        setUser({ ...user, onboarding_status: "skipped" });
      }
    } catch {
      // ignore
    }
    navigate("/overview");
  };

  return (
    <div className="flex h-dvh w-screen flex-col bg-bg-neutral">
      {!(isWelcomeRoute || isNicknameRoute || isSummaryRoute) ? (
        <header className="sticky top-0 z-[100] flex shrink-0 items-center justify-between gap-3 bg-bg-neutral px-4 py-[6px] sm:px-6 sm:py-[14px]">
          <Link
            to="/"
            className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v3-brand-strong focus-visible:ring-offset-2"
          >
            <Logo />
          </Link>
          <button
            type="button"
            onClick={handleSkip}
            className="cursor-pointer rounded text-xs font-medium text-v3-text-weak transition-colors hover:text-v3-fill-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v3-brand-strong focus-visible:ring-offset-2 sm:text-sm"
          >
            Skip for now →
          </button>
        </header>
      ) : null}
      <AuthCheck>
        <main
          className={cn(
            "min-h-0 bg-bg-neutral",
            isSummaryRoute
              ? "w-full flex-1"
              : isMiscRoute
                ? "mx-auto h-fit w-fit max-w-[620px]"
                : "mx-auto w-full flex-1",
            isWelcomeRoute || isNicknameRoute
              ? "overflow-y-auto lg:overflow-hidden"
              : isSummaryRoute
                ? "overflow-y-auto lg:overflow-hidden"
                : "overflow-y-auto",
            isSummaryRoute
              ? "max-w-none p-0"
              : isWelcomeRoute
                ? "max-w-none px-5 py-8 sm:px-10 sm:py-12"
                : isNicknameRoute
                  ? "max-w-none px-5 py-8 sm:px-10 sm:py-12"
                  : isMiscRoute
                    ? null
                    : "max-w-[620px] px-4 pb-6 sm:px-6",
          )}
        >
          <Outlet />
        </main>
      </AuthCheck>
    </div>
  );
}
