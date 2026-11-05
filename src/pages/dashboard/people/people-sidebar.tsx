import { ConnectionCard, PendingConnectionCard } from "./person-card";
import headerOptionsIcon from "@/assets/icon/people/header-options.svg";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { PeopleResponse, Person, PendingConnection } from "@/api/people";

interface Props {
  people?: PeopleResponse;
  loading: boolean;
  unavailable?: boolean;
  selected: string | null;
  onSelect: (id: string) => void;
  onInvite: () => void;
  onBlocked: () => void;
  onActivation: () => void;
  onSettings: (person: Person) => void;
  onResend: (invite: PendingConnection) => void;
  onCancel: (invite: PendingConnection) => void;
}

export function PeopleSidebar({
  people,
  loading,
  unavailable = false,
  selected,
  onSelect,
  onInvite,
  onBlocked,
  onActivation,
  onSettings,
  onResend,
  onCancel,
}: Props) {
  const connections = people?.connections ?? [];
  const pending = people?.pending ?? [];
  return (
    <aside
      aria-label="Your connections"
      className="mx-auto flex h-full min-h-0 w-full max-w-[964px] flex-col overflow-y-auto px-4 pb-6 sm:px-8"
    >
      <div className="flex min-h-12 flex-wrap items-center justify-between gap-4 pb-6 pt-8 sm:min-h-[90px] sm:pb-6 sm:pt-[18px]">
        <h1 className="flex items-center gap-1 font-geist text-base font-semibold text-text-neutral-strong">
          People{" "}
          <span className="rounded-full bg-fill-neutral-weak px-2 py-0.5 text-xs font-medium leading-4 text-text-neutral-weak">
            {connections.length + pending.length}
          </span>
        </h1>
        <div className="flex items-center gap-2">
          <Button
            size="form"
            className="people-control h-10 rounded-full px-5 font-geist font-bold"
            onClick={onInvite}
          >
            Invite people
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="People options"
                className="people-control size-10 rounded-full bg-fill-neutral-weak"
              >
                <img
                  src={headerOptionsIcon}
                  alt=""
                  aria-hidden
                  className="brightness-0 dark:brightness-100"
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="navigation-menu motion-reduce:animate-none"
            >
              <DropdownMenuItem onSelect={onActivation}>
                Memento access
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onBlocked}>
                Blocked people
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <nav aria-label="People" className="pb-4">
        {loading ? (
          <div
            role="status"
            aria-label="Loading people"
            className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
          >
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <Skeleton
                key={index}
                className="h-[264px] rounded-3xl motion-reduce:animate-none"
              />
            ))}
          </div>
        ) : unavailable ? null : connections.length || pending.length ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {connections.map((person) => (
              <ConnectionCard
                key={person.user_id}
                person={person}
                selected={selected === person.user_id}
                onOpen={() => onSelect(person.user_id)}
                onSettings={() => onSettings(person)}
              />
            ))}
            {pending.map((invite) => (
              <PendingConnectionCard
                key={invite.invite_id}
                invite={invite}
                selected={selected === `invite:${invite.invite_id}`}
                onOpen={() => onSelect(`invite:${invite.invite_id}`)}
                onResend={() => onResend(invite)}
                onCancel={() => onCancel(invite)}
              />
            ))}
          </div>
        ) : (
          <h2 className="px-2 py-3 text-sm text-text-neutral-weak">
            No connections yet
          </h2>
        )}
      </nav>
    </aside>
  );
}
