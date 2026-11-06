import { ChevronRight, CreditCard, LockKeyhole, LogOut, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useFeatureFlags } from "@/contexts/feature-flags";
import { PlanSummaryCard } from "@/features/insights/plan-summary-card";
import { useLogout } from "@/hooks/use-logout";
import { SettingsProfileHeader } from "./settings-profile-header";

const sections = [
  { to: "/settings/general", label: "Personal info", Icon: UserRound },
  { to: "/settings/security", label: "Security", Icon: LockKeyhole },
  { to: "/settings/beneficiary", label: "People & Groups", Icon: UsersRound },
  { to: "/settings/privacy", label: "Privacy & Account", Icon: ShieldCheck },
  { to: "/settings/billing", label: "Billing", Icon: CreditCard },
];

const rowClass = "settings-row h-[60px] w-full px-4 text-left text-sm font-medium text-text-neutral-strong";

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
      <div className="flex flex-col gap-4">
        <SettingsProfileHeader />
        <PlanSummaryCard onNavigate={(href) => navigate(href)} />
      </div>
      <div className="flex flex-col gap-4">
        <nav aria-label="Settings sections" className="settings-card flex flex-col gap-1 p-4">
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
        <div className="settings-card px-4 py-3">
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
