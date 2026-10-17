import { Search, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { PeopleResponse } from "@/api/people";
import { cn } from "@/utility";

interface Props {
  people?: PeopleResponse;
  loading: boolean;
  unavailable?: boolean;
  search: string;
  onSearch: (value: string) => void;
  selected: string | null;
  onSelect: (id: string) => void;
  onInvite: () => void;
  onBlocked: () => void;
  onActivation: () => void;
}

export function PeopleSidebar({
  people,
  loading,
  unavailable = false,
  search,
  onSearch,
  selected,
  onSelect,
  onInvite,
  onBlocked,
  onActivation,
}: Props) {
  const query = search.trim().toLocaleLowerCase();
  const connections =
    people?.connections.filter((person) =>
      `${person.name} ${person.relationship || ""}`
        .toLocaleLowerCase()
        .includes(query),
    ) || [];
  const pending =
    people?.pending.filter((invite) =>
      `${invite.name} ${invite.email}`.toLocaleLowerCase().includes(query),
    ) || [];
  return (
    <aside
      aria-label="Your connections"
      className="flex h-full min-h-0 w-full flex-col border-r border-stroke-neutral-weak bg-bg-neutral-weaker md:w-[264px] md:shrink-0"
    >
      <div className="space-y-5 px-5 pb-5 pt-7">
        <h1 className="font-garamond text-3xl font-medium text-text-neutral-strong">
          People
        </h1>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-3.5 size-4 text-icon-neutral-weak"
            aria-hidden
          />
          <Input
            variant="form"
            type="search"
            aria-label="Search people"
            placeholder="Search people"
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      <nav
        aria-label="People"
        className="min-h-0 flex-1 overflow-y-auto px-3 pb-4"
      >
        {loading ? (
          <div
            role="status"
            aria-label="Loading people"
            className="space-y-4 px-2"
          >
            {[0, 1, 2].map((index) => (
              <Skeleton
                key={index}
                className="h-14 rounded-xl motion-reduce:animate-none"
              />
            ))}
          </div>
        ) : unavailable ? null : (
          <>
            <h2 className="mb-2 px-2 text-xs font-medium text-text-neutral-weaker">
              Connections
            </h2>
            {connections.map((person) => (
              <Button
                size="form"
                key={person.user_id}
                variant="ghost"
                aria-label={`${person.name} ${person.relationship || "Connection"}`}
                onClick={() => onSelect(person.user_id)}
                aria-pressed={selected === person.user_id}
                className={cn(
                  "people-control mb-1 h-auto min-h-16 w-full justify-start gap-3 rounded-xl px-3 py-3 text-left",
                  selected === person.user_id &&
                    "bg-bg-neutral ring-1 ring-stroke-neutral-weak",
                )}
              >
                <Avatar size="lg" aria-hidden="true">
                  <AvatarImage src={person.avatar_url || undefined} alt="" />
                  <AvatarFallback>{person.name.slice(0, 1)}</AvatarFallback>
                </Avatar>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-text-neutral-strong">
                    {person.name}
                  </span>
                  <span className="block truncate text-xs font-normal text-text-neutral-weak">
                    {person.relationship || "Connection"}
                  </span>
                </span>
              </Button>
            ))}
            {!connections.length && (
              <p className="px-2 py-3 text-sm text-text-neutral-weak">
                {query
                  ? "No matching connections."
                  : "Your connections will appear here."}
              </p>
            )}
            {pending.length > 0 && (
              <div className="mt-7">
                <h2 className="mb-2 px-2 text-xs font-medium text-text-neutral-weaker">
                  Pending invitations
                </h2>
                {pending.map((invite) => (
                  <Button
                    size="form"
                    key={invite.invite_id}
                    variant="ghost"
                    aria-label={`${invite.name} Pending`}
                    onClick={() => onSelect(`invite:${invite.invite_id}`)}
                    aria-pressed={selected === `invite:${invite.invite_id}`}
                    className={cn(
                      "people-control mb-1 h-auto min-h-16 w-full justify-start gap-3 rounded-xl px-3 py-3 text-left",
                      selected === `invite:${invite.invite_id}` &&
                        "bg-bg-neutral ring-1 ring-stroke-neutral-weak",
                    )}
                  >
                    <Avatar size="lg" aria-hidden="true">
                      <AvatarFallback>{invite.name.slice(0, 1)}</AvatarFallback>
                    </Avatar>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-text-neutral-strong">
                        {invite.name}
                      </span>
                      <span className="block text-xs font-normal text-text-neutral-weaker">
                        Pending
                      </span>
                    </span>
                  </Button>
                ))}
              </div>
            )}
          </>
        )}
      </nav>
      <div className="space-y-2 border-t border-stroke-neutral-weak p-4">
        <Button
          size="form"
          variant="outline"
          className="people-control w-full"
          onClick={onInvite}
        >
          <UserPlus data-icon="inline-start" aria-hidden />
          Invite someone
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="people-control w-full text-text-neutral-weak"
          onClick={onActivation}
        >
          My Memento
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="people-control w-full text-text-neutral-weak"
          onClick={onBlocked}
        >
          Blocked people
        </Button>
      </div>
    </aside>
  );
}
