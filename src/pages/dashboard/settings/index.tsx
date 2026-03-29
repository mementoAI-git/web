import { Navigate, NavLink, useParams } from "react-router-dom";
import { cn } from "@/utility";
import General from "@/components/modal/settings/general";
import Security from "@/components/modal/settings/security";
import Beneficiary from "@/components/modal/settings/beneficiary&group";
import Privacy from "@/components/modal/settings/privacy";
import Stats from "@/components/modal/settings/stats";
import { Settings, Lock, Users, Shield, ChartColumn } from "lucide-react";

const navItemBase =
  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 font-inter text-sm text-v3-text-weak outline-none " +
  "motion-safe:transition-[background-color,color] motion-safe:duration-150 motion-safe:ease-out " +
  "hover:bg-v3-fill-weak hover:text-v3-text-strong " +
  "focus-visible:ring-2 focus-visible:ring-v3-stroke-strong focus-visible:ring-offset-2 focus-visible:ring-offset-white " +
  "[&_svg]:shrink-0 [&_svg]:text-current";

const settings = {
  general: {
    label: "Personal info",
    icon: <Settings size={16} strokeWidth={1.5} />,
    component: <General />,
  },
  stats: {
    label: "Stats",
    icon: <ChartColumn size={16} strokeWidth={1.5} />,
    component: <Stats />,
  },
  security: {
    label: "Security",
    icon: <Lock size={16} strokeWidth={1.5} />,
    component: <Security />,
  },
  beneficiary: {
    label: "Beneficiary & Group",
    icon: <Users size={16} strokeWidth={1.5} />,
    component: <Beneficiary />,
  },
  privacy: {
    label: "Privacy & Account",
    icon: <Shield size={16} strokeWidth={1.5} />,
    component: <Privacy />,
  },
} as const;

type SettingKey = keyof typeof settings;

const VALID_TABS: SettingKey[] = ["general", "stats", "security", "beneficiary", "privacy"];

function isValidTab(tab: string | undefined): tab is SettingKey {
  return !!tab && VALID_TABS.includes(tab as SettingKey);
}

export default function SettingsPage() {
  const { tab } = useParams<{ tab: string }>();

  if (!isValidTab(tab)) {
    return <Navigate to="/settings/general" replace />;
  }

  const navLinks = (Object.entries(settings) as [SettingKey, (typeof settings)[SettingKey]][]).map(
    ([key, setting]) => (
      <NavLink
        key={key}
        to={`/settings/${key}`}
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

  return (
    <div className="page-viewport hide-scrollbar w-full flex flex-col pl-10">
      <div className="mx-auto flex w-full max-w-[1000px] flex-col">

        {/* Sidebar + content */}
        <div className="flex w-full gap-[80px] pt-8">

          {/* Vertical nav */}
          <nav
            aria-label="Settings sections"
            className="sticky top-6 flex w-44 shrink-0 flex-col gap-0.5 self-start"
          >
            {navLinks}
          </nav>

          {/* Tab content */}
          <div
            className="min-w-0 flex-1 pb-10"
            role="region"
            aria-label={`${settings[tab].label} settings`}
          >
            {settings[tab].component}
          </div>

        </div>
      </div>
    </div>
  );
}
