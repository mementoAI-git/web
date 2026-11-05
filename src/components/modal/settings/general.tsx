import { useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { cn } from "@/utility";
import { useStore } from "@/hooks/use-store";
import { GeneralProfileForm } from "./general-profile-form";
import { SettingsProfileHeader } from "@/pages/dashboard/settings/settings-profile-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SettingsSocialProfiles } from "./settings-social-profiles";
import { SettingsAbout } from "./settings-about";
import RecentActivitiesSection from "@/pages/dashboard/overview/sections/recent-activities-section";

const personalSubTabPill =
  "inline-flex h-8 items-center rounded-full px-3 font-inter text-xs font-medium " +
  "motion-safe:transition-[background-color,color] motion-safe:duration-150 motion-safe:ease-out " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v3-stroke-strong focus-visible:ring-offset-2";

export default function General() {
  const { user } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("view");
  const activeTab =
    requestedTab === "profile" || requestedTab === "activities"
      ? requestedTab
      : "about";

  return (
    <div className="flex w-full flex-col gap-12">
      <SettingsProfileHeader />

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          const next = new URLSearchParams(searchParams);
          next.set("view", String(value));
          setSearchParams(next);
        }}
        className="flex-col gap-6"
      >
        <nav aria-label="Personal information">
          <TabsList
            aria-label="Personal information sections"
            className="h-auto w-full flex-wrap justify-start gap-3 rounded-none bg-transparent p-0"
          >
            {[
              ["about", "About me"],
              ["profile", "Profile"],
              ["activities", "Activities"],
            ].map(([value, label]) => (
              <TabsTrigger
                key={value}
                value={value}
                className={cn(
                  personalSubTabPill,
                  "flex-none bg-fill-neutral-weak text-text-neutral-weak hover:bg-fill-neutral-weak hover:text-text-neutral-strong data-active:bg-fill-tab-active data-active:text-text-tab-active dark:data-active:bg-fill-tab-active dark:data-active:text-text-tab-active",
                )}
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </nav>
        <TabsContent value="about">
          <SettingsAbout key={user?._id} />
        </TabsContent>
        <TabsContent value="activities">
          <Card className="sky-card rounded-3xl border border-stroke-neutral-weak bg-fill-neutral-weak p-6 ring-0">
            <RecentActivitiesSection />
          </Card>
        </TabsContent>
        <TabsContent value="profile">
          <GeneralProfileForm key={user?._id} />
          <SettingsSocialProfiles key={user?._id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
