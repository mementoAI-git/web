import { useState } from "react";
import useSWR from "swr";
import { ArrowLeft } from "lucide-react";
import { getPeople, PEOPLE_ENDPOINT } from "@/api/people";
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
import { BlockedPeopleDialog } from "./connection-settings";
import { PeopleWelcome } from "./people-welcome";
import { RelationshipWorkspace } from "./relationship-workspace";
import "./people-motion.css";

export default function PeoplePage() {
  const { user } = useStore();
  const { open } = useModal();
  const [activation, setActivation] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [search, setSearch] = useState("");
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
      {activation && <ActivationDialog onClose={() => setActivation(false)} />}
      {blocked && <BlockedPeopleDialog onClose={() => setBlocked(false)} />}
      <div
        className={cn(
          "h-full min-h-0 w-full md:w-auto md:flex",
          (hasSelection || error) && "hidden",
        )}
      >
        <PeopleSidebar
          people={data}
          unavailable={Boolean(error && !data)}
          loading={loading}
          search={search}
          onSearch={setSearch}
          selected={selected}
          onSelect={setSelected}
          onInvite={invite}
          onBlocked={() => setBlocked(true)}
          onActivation={() => setActivation(true)}
        />
      </div>
      <div
        className={cn(
          "people-main min-h-0 min-w-0 flex-1 flex-col p-3 md:flex sm:p-5",
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
              className="people-control m-4 w-fit md:hidden"
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
        ) : (
          <PeopleWelcome
            hasPeople={Boolean(
              data?.connections.length || data?.pending.length,
            )}
            loading={loading}
            onInvite={invite}
          />
        )}
      </div>
    </section>
  );
}
