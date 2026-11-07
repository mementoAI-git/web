import { useState } from "react";
import useSWR from "swr";
import { ArrowLeft } from "lucide-react";
import { getPeople, PEOPLE_ENDPOINT, type Person } from "@/api/people";
import { useRequestRecovery } from "@/hooks/use-request-recovery";
import { useStore } from "@/hooks/use-store";
import { useModal } from "@/hooks/use-modal";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { cn } from "@/utility";
import { PeopleSidebar } from "./people-sidebar";
import { ActivationDialog } from "./activation-dialog";
import { BlockedPeopleDialog, ConnectionSettingsDialog } from "./connection-settings";
import { RelationshipWorkspace } from "./relationship-workspace";
import "./people-motion.css";

export default function PeoplePage() {
  const { user } = useStore();
  const { open } = useModal();
  const [activation, setActivation] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [settingsPerson, setSettingsPerson] = useState<Person | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    user?._id ? [PEOPLE_ENDPOINT, user._id] : null,
    getPeople,
    { shouldRetryOnError: false, refreshInterval: 15000 },
  );
  const retry = useRequestRecovery("people-list", error, mutate, "Couldn’t load your people. Please try again.");
  const loading = !user?._id || isLoading;
  const person =
    !error && data?.connections.find((value) => value.user_id === selected);
  const pending =
    !error &&
    data?.pending.find((value) => `invite:${value.invite_id}` === selected);
  const hasSelection = Boolean(person || pending);
  const invite = () => open("add-beneficiary", { mode: "connection" });
  return (
    <section
      aria-label="People"
      className="flex h-full min-h-0 w-full overflow-hidden bg-background font-inter"
    >
      {settingsPerson && <ConnectionSettingsDialog person={settingsPerson} onClose={() => setSettingsPerson(null)} />}
      {activation && <ActivationDialog onClose={() => setActivation(false)} />}
      {blocked && <BlockedPeopleDialog onClose={() => setBlocked(false)} />}
      <div
        className={cn(
          "h-full min-h-0 w-full",
          (hasSelection || error) && "hidden",
        )}
      >
        <PeopleSidebar
          people={data}
          unavailable={Boolean(error && !data)}
          loading={loading}
          selected={selected}
          onSelect={setSelected}
          onInvite={invite}
          onBlocked={() => setBlocked(true)}
          onActivation={() => setActivation(true)}
          onSettings={setSettingsPerson}
          onResend={invite => open("resend-invite", { email: invite.email, mode: "connection" })}
          onCancel={invite => open("delete-beneficiary", { id: invite.invite_id, mode: "connection" })}
        />
      </div>
      <div
        className={cn(
          "people-main min-h-0 min-w-0 flex-1 flex-col p-3 sm:p-5",
          hasSelection || error ? "flex" : "hidden",
        )}
      >
        {error ? (
          <div
            className="people-workspace flex h-full flex-col items-center justify-center gap-4 rounded-2xl border border-stroke-neutral-weak bg-bg-neutral p-8"
          >
            <Button size="form" variant="outline" onClick={retry} disabled={isValidating}>
              Retry loading people
            </Button>
          </div>
        ) : person ? (
          <RelationshipWorkspace
            key={person.user_id}
            person={person}
            onBack={() => setSelected(null)}
          />
        ) : pending ? (
          <div className="people-workspace flex h-full flex-col overflow-y-auto rounded-2xl border border-stroke-neutral-weak bg-bg-neutral">
            <Button
              size="form"
              variant="ghost"
              className="people-control m-4 w-fit"
              onClick={() => setSelected(null)}
            >
              <ArrowLeft data-icon="inline-start" aria-hidden />
              Back to people
            </Button>
            <Empty className="px-6">
              <EmptyHeader>
                <EmptyTitle className="text-3xl">Invitation pending</EmptyTitle>
                <EmptyDescription>
                  {pending.name} hasn’t accepted your invitation yet. Your
                  shared space will open once they do.
                </EmptyDescription>
              </EmptyHeader>
              <div className="flex gap-3">
                <Button
                  size="form"
                  className="people-control"
                  onClick={() =>
                    open("resend-invite", {
                      email: pending.email,
                      mode: "connection",
                    })
                  }
                >
                  Resend invite
                </Button>
                <Button
                  size="form"
                  variant="outline"
                  className="people-control"
                  onClick={() =>
                    open("delete-beneficiary", {
                      id: pending.invite_id,
                      mode: "connection",
                    })
                  }
                >
                  Cancel invite
                </Button>
              </div>
            </Empty>
          </div>
        ) : null}
      </div>
    </section>
  );
}
