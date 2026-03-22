import { Navigate, NavLink, useParams } from "react-router-dom";
import { cn } from "@/utility";
import General from "@/components/modal/settings/general";
import Security from "@/components/modal/settings/security";
import Beneficiary from "@/components/modal/settings/beneficiary&group";
import Privacy from "@/components/modal/settings/privacy";
import { GearIcon, Lock2Icon, ShieldIcon, UsersIcon } from "@/components/icons";
import { SettingsProfileHeader } from "./settings-profile-header";

/** Horizontal tabs: v3 tokens, motion-safe ≤300ms, focus-visible rings, ≥40px hit targets (userinterface-wiki). */
const tabLinkBase =
  "inline-flex min-h-10 shrink-0 items-center gap-2 border-b-2 border-transparent px-2 pb-3 pt-1 font-inter text-sm outline-none " +
  "text-v3-text-weak motion-safe:transition-[color,border-color] motion-safe:duration-200 motion-safe:ease-out " +
  "hover:text-v3-text-strong " +
  "focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-v3-stroke-strong focus-visible:ring-offset-2 focus-visible:ring-offset-white " +
  "[&_svg]:shrink-0 [&_svg]:text-current";

const settings = {
  general: {
    label: "General",
    icon: <GearIcon strokeWidth={1.5} width={16.67} height={16.67} />,
    component: <General />,
  },
  security: {
    label: "Security",
    icon: <Lock2Icon strokeWidth={1.4} width={13.37} height={15} />,
    component: <Security />,
  },
  beneficiary: {
    label: "Beneficiary & Group",
    icon: <UsersIcon strokeWidth={1.5} width={16} height={15} />,
    component: <Beneficiary />,
  },
  privacy: {
    label: "Privacy & Account",
    icon: <ShieldIcon strokeWidth={1.5} width={16} height={15} />,
    component: <Privacy />,
  },
} as const;

type SettingKey = keyof typeof settings;

const VALID_TABS: SettingKey[] = ["general", "security", "beneficiary", "privacy"];

function isValidTab(tab: string | undefined): tab is SettingKey {
  return !!tab && VALID_TABS.includes(tab as SettingKey);
}

export default function SettingsPage() {
  const { tab } = useParams<{ tab: string }>();

  if (!isValidTab(tab)) {
    return <Navigate to="/settings/general" replace />;
  }

  const tabLinks = (Object.entries(settings) as [SettingKey, (typeof settings)[SettingKey]][]).map(([key, setting]) => (
    <NavLink
      key={key}
      to={`/settings/${key}`}
      className={({ isActive }) =>
        cn(
          tabLinkBase,
          isActive &&
            "border-v3-brand-strong font-semibold text-v3-text-strong [&_svg]:text-v3-fill-strong motion-reduce:transition-none",
        )
      }
    >
      {setting.icon}
      <span className="max-w-[11rem] truncate sm:max-w-none">{setting.label}</span>
    </NavLink>
  ));

  return (
    <div className="page-viewport hide-scrollbar w-full flex flex-col pt-10">
      <div
        className={cn(
          "mx-auto flex w-full max-w-[600px] flex-col bg-white shadow-sm",
          "motion-reduce:shadow-none",
        )}
      >
        <div className="h-fit w-full shrink-0 px-4 sm:px-0">
          <SettingsProfileHeader />
        </div>
        <div className="w-full border-b border-v3-stroke-weak">
          <nav
            aria-label="Settings sections"
            className="hide-scrollbar flex h-fit w-full gap-1 overflow-x-auto px-4 pt-5 sm:gap-4 sm:px-0 sm:pt-8"
          >
            {tabLinks}
          </nav>
        </div>

        <div
          className="w-full px-4 pb-8 pt-6 sm:px-0 sm:pb-10 sm:pt-8"
          role="region"
          aria-label={`${settings[tab].label} settings`}
        >
          <div className="w-full">{settings[tab].component}</div>
        </div>
      </div>
    </div>
  );
}
