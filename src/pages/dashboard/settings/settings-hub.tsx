import type { CSSProperties } from "react";
import { ChevronRight, CreditCard, LockKeyhole, LogOut, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useFeatureFlags } from "@/contexts/feature-flags";
import { PlanSummaryCard } from "@/features/insights/plan-summary-card";
import { useLogout } from "@/hooks/use-logout";
import { PageHeading } from "@/pages/dashboard/component/page-heading";
import { SettingsProfileHeader } from "./settings-profile-header";

const sections = [
  { to: "/settings/general", label: "Personal info", Icon: UserRound },
  { to: "/settings/security", label: "Security", Icon: LockKeyhole },
  { to: "/settings/beneficiary", label: "People & Groups", Icon: UsersRound },
  { to: "/settings/privacy", label: "Privacy & Account", Icon: ShieldCheck },
  { to: "/settings/billing", label: "Billing", Icon: CreditCard },
];

const rowClass = "settings-card settings-row h-[60px] w-full px-5 text-left text-sm font-medium text-text-neutral-strong";

export function SettingsHub() {
  const navigate = useNavigate();
  const { canUse } = useFeatureFlags();
  const { logout, loading } = useLogout();
  const canUseBilling = canUse("settings.billing_tab", true);
  const signOut = async () => {
    try {
      await logout();
    } catch {
      toast.error("Couldn’t log you out. Please try again.");
    }
  };

  return (
    <div className="flex flex-col gap-10">
      <PageHeading className="page-rise page-rise--heading">
        Settings & <em>profile</em>
      </PageHeading>
      <div className="page-stagger flex flex-col gap-4" style={{ "--page-stagger-start": 1 } as CSSProperties}>
        <SettingsProfileHeader />
        <PlanSummaryCard onNavigate={(href) => navigate(href)} />
      </div>
      <div className="flex flex-col gap-4">
        <nav
          aria-label="Settings sections"
          className="page-rise page-stagger settings-grouped-list"
          style={{ "--page-rise-index": 3, "--page-stagger-start": 4 } as CSSProperties}
        >
          {sections
            .filter((section) => canUseBilling || section.label !== "Billing")
            .map(({ to, label, Icon }) => (
              <Link key={to} to={to} className={rowClass}>
                <span className="flex min-w-0 items-center gap-4">
                  <Icon className="size-5 shrink-0" strokeWidth={1.75} aria-hidden />
                  <span className="truncate">{label}</span>
                </span>
                <ChevronRight className="size-5 shrink-0" strokeWidth={1.75} aria-hidden />
              </Link>
            ))}
        </nav>
        <div className="page-rise settings-grouped-list" style={{ "--page-rise-index": 9 } as CSSProperties}>
          <button
            type="button"
            className={rowClass}
            disabled={loading}
            onClick={() => void signOut()}
          >
            <span className="flex min-w-0 items-center gap-4">
              <LogOut className="size-5 shrink-0" strokeWidth={1.75} aria-hidden />
              {loading ? "Logging out…" : "Logout"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
