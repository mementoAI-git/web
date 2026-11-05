import { Navigate, useNavigate, useOutletContext, useParams } from "react-router-dom";
import General from "@/components/modal/settings/general";
import Security from "@/components/modal/settings/security";
import PeopleAndGroups from "@/components/modal/settings/beneficiary&group";
import Privacy from "@/components/modal/settings/privacy";
import Billing from "@/components/modal/settings/billing";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useFeatureFlags } from "@/contexts/feature-flags";
import { useModal } from "@/hooks/use-modal";
import { DashboardHeader } from "@/pages/dashboard/component/dashboard-header";
import { DashboardOverlayFrame } from "@/pages/dashboard/component/dashboard-overlay-frame";
import { SettingsHub } from "./settings-hub";
import { SettingsSubpage } from "./settings-subpage";
import "@/components/modal/memory-insights/insights.css";
import "./settings-overlay.css";

const VALID_TABS = ["general", "security", "beneficiary", "privacy", "billing"];

export default function SettingsPage() {
  const { tab } = useParams<{ tab: string }>();
  const navigate = useNavigate();
  const { open } = useModal();
  const { canUse } = useFeatureFlags();
  const context = useOutletContext<{ settingsReturnTo?: string } | null>();
  const canUseBillingTab = canUse("settings.billing_tab", true);

  if (tab && !VALID_TABS.includes(tab)) {
    return <Navigate to="/settings" replace />;
  }
  if (tab === "billing" && !canUseBillingTab) {
    return <Navigate to="/settings" replace />;
  }

  return (
    <TooltipProvider>
      <div className="settings-page">
        <DashboardOverlayFrame>
          <DashboardHeader
            overlay={{
              title: (
                <h1 className="font-garamond text-3xl font-medium text-text-neutral-strong sm:text-4xl">
                  Settings & <em>profile</em>
                </h1>
              ),
              searchLabel: "Search memories",
              closeLabel: "Close settings",
              showAccountControls: !tab,
              onSearch: () => open("search-memory"),
              onClose: () => navigate(context?.settingsReturnTo ?? "/overview"),
            }}
          />
          <div className="insights-scroll">
            <main className="insights-main">
              {!tab ? <SettingsHub /> : null}
              {tab === "general" ? <General /> : null}
              {tab === "security" ? <Security /> : null}
              {tab === "beneficiary" ? <PeopleAndGroups /> : null}
              {tab === "privacy" ? (
                <SettingsSubpage title={<>Privacy & <em>account</em></>}>
                  <Privacy />
                </SettingsSubpage>
              ) : null}
              {tab === "billing" ? (
                <SettingsSubpage title="Billing">
                  <Billing />
                </SettingsSubpage>
              ) : null}
            </main>
          </div>
        </DashboardOverlayFrame>
      </div>
    </TooltipProvider>
  );
}
