import { type ReactNode } from "react";
import useSWR from "swr";
import { Clock3 } from "lucide-react";
import {
  getConnectionSettings,
  type PendingConnection,
  type Person,
} from "@/api/people";
import { useStore } from "@/hooks/use-store";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import optionsIcon from "@/assets/icon/people/options.svg";
import separator from "@/assets/icon/people/separator.svg";
import { cn } from "@/utility";

function PersonCard({
  name,
  relationship,
  selected,
  pending = false,
  avatar,
  detail,
  onOpen,
  children,
}: {
  name: string;
  relationship: string;
  selected: boolean;
  pending?: boolean;
  avatar: ReactNode;
  detail: ReactNode;
  onOpen: () => void;
  children: ReactNode;
}) {
  return (
    <Card
      className={cn(
        "relative h-[264px] min-w-0 gap-0 rounded-3xl border border-stroke-neutral-weak bg-fill-neutral-weak p-0 ring-0",
        selected && "ring-1 ring-stroke-neutral-strong",
      )}
    >
      {pending && (
        <span
          role="img"
          aria-label="Invitation pending"
          title="Invitation pending"
          className="pointer-events-none absolute left-3 top-3 z-10 flex size-9 items-center justify-center text-icon-neutral-weak"
        >
          <Clock3 className="size-4" aria-hidden />
        </span>
      )}
      <Button
        variant="ghost"
        aria-label={`${name} ${pending ? "Pending" : relationship}`}
        aria-pressed={selected}
        onClick={onOpen}
        className="people-control h-full w-full min-w-0 flex-col justify-between rounded-[inherit] px-6 py-[31px] text-center font-geist font-normal whitespace-normal hover:bg-fill-neutral-weaker"
      >
        {avatar}
        <span className="flex w-full min-w-0 flex-col items-center gap-1">
          <span className="block w-full truncate text-base font-semibold leading-6 text-text-neutral-strong">
            {name}
          </span>
          <span className="flex w-full min-w-0 items-center justify-center gap-1 text-sm leading-5 text-text-neutral-strong">
            <span className="min-w-0 truncate">{relationship}</span>
            <img
              src={separator}
              alt=""
              aria-hidden
              className="shrink-0 brightness-0 opacity-90 dark:brightness-100"
            />
            <span className="shrink-0">{detail}</span>
          </span>
        </span>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            aria-label={`Options for ${name}`}
            className="people-control absolute right-3 top-3 size-9 rounded-full p-0"
          >
            <img
              src={optionsIcon}
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
          {children}
        </DropdownMenuContent>
      </DropdownMenu>
    </Card>
  );
}

export function ConnectionCard({
  person,
  selected,
  onOpen,
  onSettings,
}: {
  person: Person;
  selected: boolean;
  onOpen: () => void;
  onSettings: () => void;
}) {
  const { user } = useStore();
  const { data, error, mutate, isLoading } = useSWR(
    ["people-settings", user?._id, person.user_id],
    () => getConnectionSettings(person.user_id),
    { shouldRetryOnError: false, revalidateOnFocus: false },
  );
  const count = data?.shared_item_count;
  const validCount = Number.isSafeInteger(count) && count! >= 0;
  return (
    <PersonCard
      name={person.name}
      relationship={data?.relationship || person.relationship || "Connection"}
      selected={selected}
      onOpen={onOpen}
      avatar={
        <span className="relative block size-[72px] shrink-0">
          <UserAvatar
            alt=""
            userId={person.user_id}
            src={person.avatar_url}
            name={person.name}
            className="size-[72px]!"
          />
          {Number.isSafeInteger(person.unread_count) &&
            person.unread_count! > 0 && (
              <span
                aria-label={`${person.unread_count} unread messages`}
                className="absolute -right-0.5 top-0.5 flex size-5 items-center justify-center rounded-full bg-fill-brand-strong text-xs font-semibold leading-4 text-[var(--brown-1000)]"
              >
                {person.unread_count! > 99 ? "99+" : person.unread_count}
              </span>
            )}
        </span>
      }
      detail={
        validCount && !error
          ? `${count} ${count === 1 ? "memory" : "memories"}`
          : isLoading
            ? "Loading memories…"
            : "Memories unavailable"
      }
    >
      <DropdownMenuItem onSelect={onOpen}>Open shared space</DropdownMenuItem>
      <DropdownMenuItem onSelect={onSettings}>
        Connection settings
      </DropdownMenuItem>
      {error && (
        <DropdownMenuItem onSelect={() => void mutate()}>
          Retry memory count
        </DropdownMenuItem>
      )}
    </PersonCard>
  );
}

export function PendingConnectionCard({
  invite,
  selected,
  onOpen,
  onResend,
  onCancel,
}: {
  invite: PendingConnection;
  selected: boolean;
  onOpen: () => void;
  onResend: () => void;
  onCancel: () => void;
}) {
  return (
    <PersonCard
      name={invite.name}
      relationship={invite.relationship || "Connection"}
      selected={selected}
      pending
      onOpen={onOpen}
      avatar={
        <UserAvatar
          alt=""
          email={invite.email}
          name={invite.name}
          className="size-[72px]!"
        />
      }
      detail="Pending invitation"
    >
      <DropdownMenuItem onSelect={onResend}>Resend invite</DropdownMenuItem>
      <DropdownMenuItem onSelect={onCancel}>Cancel invite</DropdownMenuItem>
    </PersonCard>
  );
}
