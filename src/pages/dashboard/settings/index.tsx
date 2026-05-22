import { useState } from "react";
import { Navigate, NavLink, useParams } from "react-router-dom";
import { cn } from "@/utility";
import General from "@/components/modal/settings/general";
import Security from "@/components/modal/settings/security";
import Beneficiary from "@/components/modal/settings/beneficiary&group";
import Privacy from "@/components/modal/settings/privacy";
import { Settings, Lock, Users, Shield, Menu, X, CreditCard } from "lucide-react";
import Billing from "@/components/modal/settings/billing";
import { useFeatureFlags } from "@/contexts/feature-flags";

const navItemBase =
  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 font-inter text-sm text-v3-text-weak outline-none " +
  "motion-safe:transition-[background-color,color] motion-safe:duration-150 motion-safe:ease-out " +
  "hover:bg-v3-fill-weak hover:text-v3-text-strong " +
  "focus-visible:ring-2 focus-visible:ring-v3-stroke-strong focus-visible:ring-offset-2 focus-visible:ring-offset-white " +
  "[&_svg]:shrink-0 [&_svg]:text-current";

const mobileNavItemBase =
  "flex items-center gap-2 rounded-lg px-3 py-2 font-inter text-sm whitespace-nowrap " +
  "motion-safe:transition-[background-color,color] motion-safe:duration-150 motion-safe:ease-out " +
  "hover:bg-v3-fill-weak hover:text-v3-text-strong " +
  "focus-visible:ring-2 focus-visible:ring-v3-stroke-strong focus-visible:ring-offset-2";

const settings = {
  general: {
    label: "Personal info",
    shortLabel: "Profile",
    icon: <Settings size={16} strokeWidth={1.5} />,
  },
  security: {
    label: "Security",
    shortLabel: "Security",
    icon: <Lock size={16} strokeWidth={1.5} />,
    component: <Security />,
  },
  beneficiary: {
    label: "Beneficiary & Group",
    shortLabel: "People",
    icon: <Users size={16} strokeWidth={1.5} />,
    component: <Beneficiary />,
  },
  privacy: {
    label: "Privacy & Account",
    shortLabel: "Privacy",
    icon: <Shield size={16} strokeWidth={1.5} />,
    component: <Privacy />,
  },
  billing: {
    label: "Billing",
    shortLabel: "Billing",
    icon: <CreditCard size={16} strokeWidth={1.5} />,
    component: <Billing />,
  },
} as const;

type SettingKey = keyof typeof settings;

const VALID_TABS: SettingKey[] = [
  "general",
  "security",
  "beneficiary",
  "privacy",
  "billing",
];

function isValidTab(tab: string | undefined): tab is SettingKey {
  return !!tab && VALID_TABS.includes(tab as SettingKey);
}

export default function SettingsPage() {
  const { tab } = useParams<{ tab: string }>();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { canUse } = useFeatureFlags();
  const canUseBillingTab = canUse("settings.billing_tab", true);

  if (!isValidTab(tab)) {
    return <Navigate to="/settings/general" replace />;
  }
  if (tab === "billing" && !canUseBillingTab) {
    return <Navigate to="/settings/general" replace />;
  }

  const availableSettings = canUseBillingTab ?
      settings
    : Object.fromEntries(
        Object.entries(settings).filter(([key]) => key !== "billing"),
      );

  const navLinks = (Object.entries(availableSettings) as [SettingKey, (typeof settings)[SettingKey]][]).map(
    ([key, setting]) => (
      <NavLink
        key={key}
        to={`/settings/${key}`}
        onClick={() => setMobileMenuOpen(false)}
        className={({ isActive }) =>
          cn(
            navItemBase,
            isActive && "bg-v3-fill-weak font-semibold text-v3-text-strong",
          )
        }
      >
        {setting.icon}
        <span className="truncate">{setting.label}</span>
      </NavLink>
    ),
  );

  const mobileNavLinks = (Object.entries(availableSettings) as [SettingKey, (typeof settings)[SettingKey]][]).map(
    ([key, setting]) => (
      <NavLink
        key={key}
        to={`/settings/${key}`}
        className={({ isActive }) =>
          cn(
            mobileNavItemBase,
            isActive 
              ? "bg-v3-fill-weak font-semibold text-v3-text-strong" 
              : "text-v3-text-weak",
          )
        }
      >
        {setting.icon}
        <span>{setting.shortLabel}</span>
      </NavLink>
    ),
  );

  return (
    <div className="page-viewport hide-scrollbar w-full flex flex-col px-4 sm:px-6 lg:px-8 xl:px-10">
      <div className="mx-auto flex w-full max-w-[1000px] flex-col">
        
        {/* Mobile Header with Menu Button */}
        <div className="flex items-center justify-between pt-6 pb-4 lg:hidden">
          <h1 className="font-garamond text-2xl font-medium text-v3-text-strong">
            Settings
          </h1>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={cn(
              "flex size-10 items-center justify-center rounded-xl",
              "bg-v3-fill-weak text-v3-text-strong",
              "motion-safe:transition-all motion-safe:duration-150",
              "hover:bg-v3-fill-weaker active:scale-95",
              "focus-visible:ring-2 focus-visible:ring-v3-stroke-strong focus-visible:ring-offset-2",
            )}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <nav
            aria-label="Settings sections mobile"
            className={cn(
              "flex flex-col gap-0.5 rounded-2xl border border-v3-stroke-weak bg-white p-2 shadow-lg lg:hidden",
              "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2",
              "motion-safe:duration-200",
            )}
          >
            {navLinks}
          </nav>
        )}

        {/* Horizontal scrollable nav for tablet (md to lg) */}
        <nav
          aria-label="Settings sections tablet"
          className="hidden md:flex lg:hidden overflow-x-auto pb-4 pt-4 -mx-2 px-2 scrollbar-hide"
        >
          <div className="flex items-center gap-1">
            {mobileNavLinks}
          </div>
        </nav>

        {/* Desktop: Sidebar + content */}
        <div className="flex w-full flex-col gap-6 pt-6 lg:flex-row lg:gap-12 xl:gap-16">
          {/* Desktop Vertical nav - hidden on mobile and tablet */}
          <nav
            aria-label="Settings sections"
            className="hidden lg:flex lg:w-48 lg:shrink-0 lg:flex-col lg:gap-0.5 lg:self-start lg:sticky lg:top-6"
          >
            {navLinks}
          </nav>

          {/* Tab content */}
          <div
            className="min-w-0 flex-1 pb-10"
            role="region"
            aria-label={`${settings[tab].label} settings`}
          >
            {tab === "general" ? <General /> : "component" in settings[tab] ? settings[tab].component : null}
          </div>
        </div>
      </div>
    </div>
  );
}
