import { Navigate, NavLink, useParams } from "react-router-dom";
import { cn } from "@/utility";
import General from "@/components/modal/settings/general";
import Security from "@/components/modal/settings/security";
import Beneficiary from "@/components/modal/settings/beneficiary&group";
import Privacy from "@/components/modal/settings/privacy";
import { GearIcon, Lock2Icon, ShieldIcon, UsersIcon } from "@/components/icons";

/** Shell styles: v3 tokens + userinterface-wiki (motion-safe ≤300ms, focus-visible, Fitts targets, concentric radii). */
const navLinkBase =
  "flex min-h-10 w-full items-center gap-3 rounded-xl px-3 py-2.5 font-inter text-sm outline-none " +
  "text-v3-text-weak motion-safe:transition-[color,background-color,transform] motion-safe:duration-200 motion-safe:ease-out " +
  "hover:bg-v3-fill-weak active:motion-safe:scale-[0.99] " +
  "focus-visible:ring-2 focus-visible:ring-v3-stroke-strong focus-visible:ring-offset-2 focus-visible:ring-offset-white " +
  "[&_svg]:shrink-0 [&_svg]:text-v3-icon-neutral";

const pillBase =
  "inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-full px-3.5 py-2 font-inter text-sm font-semibold outline-none " +
  "bg-v3-fill-weaker text-v3-text-strong motion-safe:transition-[color,background-color,transform,box-shadow] motion-safe:duration-200 motion-safe:ease-out " +
  "hover:bg-v3-fill-weak active:motion-safe:scale-[0.99] " +
  "focus-visible:ring-2 focus-visible:ring-v3-stroke-strong focus-visible:ring-offset-2 focus-visible:ring-offset-white " +
  "[&_svg]:shrink-0";

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
    label: "Privacy & account",
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

  const navItems = (Object.entries(settings) as [SettingKey, (typeof settings)[SettingKey]][]).map(([key, setting]) => (
    <li key={key} className="sm:w-full">
      <NavLink
        to={`/settings/${key}`}
        className={({ isActive }) =>
          cn(
            navLinkBase,
            isActive && "bg-v3-fill-weak font-semibold text-v3-text-strong [&_svg]:text-v3-text-strong",
          )
        }
      >
        {setting.icon}
        <span className="capitalize text-pretty">{setting.label}</span>
      </NavLink>
    </li>
  ));

  const pillNavItems = (Object.entries(settings) as [SettingKey, (typeof settings)[SettingKey]][]).map(([key, setting]) => (
    <NavLink
      key={key}
      to={`/settings/${key}`}
      className={({ isActive }) =>
        cn(
          pillBase,
          isActive &&
            "bg-v3-fill-strong text-white shadow-sm [&_svg]:text-white motion-reduce:shadow-none",
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive ? setting.icon : null}
          <span className="max-w-[9rem] truncate text-pretty sm:max-w-none">{setting.label}</span>
        </>
      )}
    </NavLink>
  ));

  return (
    <div className="page-viewport hide-scrollbar flex min-h-0 flex-1 flex-col overflow-hidden bg-v3-fill-weaker motion-reduce:bg-white">
      {/* ux-proximity-grouping: tighter page padding; visual-concentric-radius: outer 24px → inner 16px */}
      <div className="container mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col px-4 py-5 sm:px-6 sm:py-8">
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-v3-stroke-weak bg-white shadow-sm",
            "sm:max-h-[calc(100dvh-140px)] sm:flex-row",
            "motion-reduce:shadow-none",
          )}
        >
          <aside className="flex shrink-0 flex-col gap-4 border-v3-stroke-weak px-4 py-5 sm:max-w-[272px] sm:gap-6 sm:border-r sm:px-6 sm:py-8">
            <span className="hidden font-azeret text-[11px] font-semibold uppercase tracking-widest text-v3-text-weaker sm:block">
              Settings
            </span>
            <h1 className="text-balance font-inter text-2xl font-semibold leading-tight text-v3-text-strong sm:hidden">
              Settings
            </h1>
            <nav aria-label="Settings sections" className="hidden w-full sm:block">
              <ul className="flex w-full flex-col gap-1">{navItems}</ul>
            </nav>
            <nav aria-label="Settings sections" className="hide-scrollbar flex w-full gap-2 overflow-x-auto pb-1 sm:hidden">
              {pillNavItems}
            </nav>
          </aside>

          <div
            className="min-h-0 flex-1 overflow-y-auto px-4 pb-8 pt-2 sm:px-8 sm:py-8 sm:pb-8 hide-scrollbar"
            role="region"
            aria-label={`${settings[tab].label} settings`}
          >
            <div className="mx-auto max-w-2xl">{settings[tab].component}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
