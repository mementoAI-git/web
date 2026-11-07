import { FolderPlus, UserPlus } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useModal } from "@/hooks/use-modal";
import { SettingsSubpage } from "@/pages/dashboard/settings/settings-subpage";
import Beneficiary from "./beneficiary";
import GroupManagement from "./group";
import { GroupDetailPage } from "./group/group-detail-page";

const actionClass =
  "h-11 rounded-full bg-fill-neutral-weak px-4 text-xs font-semibold text-text-neutral-strong [&_svg]:size-5";

export default function PeopleAndGroups() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { open } = useModal();
  const groupId = searchParams.get("group");
  const view = searchParams.get("view") === "groups" ? "groups" : "people";

  if (groupId) return <GroupDetailPage groupId={groupId} />;

  return (
    <SettingsSubpage title={<>People & <em>groups</em></>}>
      <Tabs
        value={view}
        onValueChange={(next) => setSearchParams({ view: String(next) })}
        className="page-stagger min-w-0 flex-col gap-7"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList aria-label="People and groups" className="insights-tabs">
            <TabsTrigger value="people" className="insights-tab">
              People
            </TabsTrigger>
            <TabsTrigger value="groups" className="insights-tab">
              Groups
            </TabsTrigger>
          </TabsList>
          {view === "people" ? (
            <Button
              variant="ghost"
              className={actionClass}
              onClick={() => open("add-beneficiary", { mode: "connection" })}
            >
              <UserPlus aria-hidden />
              Invite person
            </Button>
          ) : (
            <Button
              variant="ghost"
              className={actionClass}
              onClick={() => open("add-group")}
            >
              <FolderPlus aria-hidden />
              New group
            </Button>
          )}
        </div>
        <TabsContent value="people" className="mt-0">
          <Beneficiary />
        </TabsContent>
        <TabsContent value="groups" className="mt-0">
          <GroupManagement />
        </TabsContent>
      </Tabs>
    </SettingsSubpage>
  );
}
