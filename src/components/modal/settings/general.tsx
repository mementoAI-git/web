import type { CSSProperties } from "react";
import { useStore } from "@/hooks/use-store";
import { SettingsSubpage } from "@/pages/dashboard/settings/settings-subpage";
import { GeneralProfileForm } from "./general-profile-form";
import { SettingsSocialProfiles } from "./settings-social-profiles";
import { SettingsAbout } from "./settings-about";

export default function General() {
  const { user } = useStore();

  return (
    <SettingsSubpage title={<>Personal <em>info</em></>}>
      <div className="page-stagger flex flex-col gap-10">
        <SettingsAbout key={user?._id} />
        <div className="page-stagger flex flex-col gap-4" style={{ "--page-stagger-start": 2 } as CSSProperties}>
          <GeneralProfileForm key={user?._id} />
          <SettingsSocialProfiles key={user?._id} />
        </div>
      </div>
    </SettingsSubpage>
  );
}
