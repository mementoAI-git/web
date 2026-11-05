import type { ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/user-avatar";

export function PersonCard({
  name,
  email,
  user,
  details,
  menu,
}: {
  name: string;
  email: string;
  user?: { _id?: string; picture_url?: string };
  details: (string | null | undefined)[];
  menu: ReactNode;
}) {
  const label = name || email;
  return (
    <article className="settings-card flex items-start gap-4 p-4">
      <UserAvatar
        alt={label}
        src={user?.picture_url}
        name={name}
        email={email}
        userId={user?._id}
        size="lg"
        className="!size-14 shrink-0 !rounded-full"
      />
      <div className="min-w-0 flex-1 self-center">
        <h3 className="truncate text-xl font-bold text-text-neutral-strong">
          {label}
        </h3>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-text-neutral-weak">
          {details.filter(Boolean).map((detail, index) => (
            <span key={detail} className="inline-flex items-center gap-2">
              {index > 0 ? (
                <span aria-hidden className="size-1 rounded-full bg-current" />
              ) : null}
              {detail!.charAt(0).toUpperCase() + detail!.slice(1)}
            </span>
          ))}
        </p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="shrink-0 rounded-full text-icon-neutral-strong"
            aria-label={`Options for ${label}`}
          >
            <MoreHorizontal aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">{menu}</DropdownMenuContent>
      </DropdownMenu>
    </article>
  );
}
