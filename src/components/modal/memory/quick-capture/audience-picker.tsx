import { UserAvatar } from "@/components/user-avatar";
import { Check, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import type { IBeneficiary, IGroup } from "@/utility/interface";
import { cn } from "@/utility";
import "@/components/motion/navigation-motion.css";
import lockIcon from "@/assets/icon/quick-story/imgGroup.svg";
import chevronIcon from "@/assets/icon/quick-story/imgChevronDown.svg";

export type Audience = {
  visibility: "private" | "everyone";
  people: string[];
  groups: string[];
};
const chipColors = [
  "bg-fill-info-weak text-text-info-strong",
  "bg-fill-success-weak text-text-success-strong",
  "bg-fill-error-weak text-text-error-strong",
  "bg-fill-brand-weak text-text-brand-strong",
];

export function AudiencePicker({
  value,
  onChange,
  people,
  groups,
  loading,
  error,
  disabled,
}: {
  value: Audience;
  onChange: (value: Audience) => void;
  people: IBeneficiary[];
  groups: IGroup[];
  loading: boolean;
  error: boolean;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const hasShares = value.people.length + value.groups.length > 0;
  const options = [
    ...groups.map((g) => ({ id: g._id, name: g.name, group: true })),
    ...people
      .filter((p) => p._id)
      .map((p) => ({ id: p._id!, name: p.name, group: false })),
  ];
  const selected = options.filter((o) =>
    (o.group ? value.groups : value.people).includes(o.id),
  );
  const toggle = (id: string, group: boolean) => {
    const key = group ? "groups" : "people";
    setRecent((previous) =>
      [id, ...previous.filter((item) => item !== id)].slice(0, 5),
    );
    onChange({
      ...value,
      visibility: "private",
      [key]: value[key].includes(id)
        ? value[key].filter((x) => x !== id)
        : [...value[key], id],
    });
  };
  const chips = (items: typeof options) =>
    items.map((o, i) => (
      <span
        key={`${o.group}:${o.id}`}
        className={cn(
          "rounded-full px-2 py-1 text-xs font-medium",
          chipColors[i % chipColors.length],
        )}
      >
        @{o.name}
      </span>
    ));
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-bold">Who can see this?</p>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            aria-label="Choose visibility"
            className="h-auto min-h-11 w-full justify-start gap-2 rounded-lg border-stroke-neutral-weak bg-fill-neutral-weaker px-3 py-2.5 text-left font-normal whitespace-normal"
          >
            {hasShares ? (
              <span className="flex flex-wrap gap-2">
                {chips(selected)}
                {selected.length <
                  value.people.length + value.groups.length && (
                  <span>
                    Shared with {value.people.length + value.groups.length}{" "}
                    selected{" "}
                    {value.people.length + value.groups.length === 1
                      ? "person or group"
                      : "people or groups"}
                  </span>
                )}
              </span>
            ) : (
              <>
                <span
                  className={
                    value.visibility === "private"
                      ? "text-text-error-strong"
                      : "text-text-info-strong"
                  }
                >
                  {value.visibility === "private" ? (
                    <img src={lockIcon} alt="" />
                  ) : (
                    <Users className="size-5" />
                  )}
                </span>
                <span className="flex-1">
                  {value.visibility === "private"
                    ? "Private - Only you can see this"
                    : "Everyone - Visible to everyone"}
                </span>
                <img src={chevronIcon} alt="" className="ml-auto dark:invert" />
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          side="top"
          sideOffset={8}
          aria-label="Story visibility"
          onEscapeKeyDown={(event) => event.stopPropagation()}
          className="navigation-menu z-[10001] w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-2rem)] gap-4 rounded-lg border border-stroke-neutral-weak bg-bg-neutral p-3 font-geist"
        >
          <div className="grid grid-cols-2 gap-2 border-b border-stroke-neutral-weak pb-4">
            {(["private", "everyone"] as const).map((mode) => (
              <Button
                key={mode}
                variant="ghost"
                aria-label={mode === "private" ? "Private" : "Everyone"}
                aria-pressed={value.visibility === mode && !hasShares}
                onClick={() =>
                  onChange({ visibility: mode, people: [], groups: [] })
                }
                className={cn(
                  "relative h-auto items-start justify-start gap-2 rounded-lg px-2 py-2 whitespace-normal",
                  mode === "private"
                    ? "bg-fill-error-weak"
                    : "bg-fill-info-weak",
                )}
              >
                {mode === "private" ? (
                  <img src={lockIcon} alt="" />
                ) : (
                  <Users className="size-5 text-icon-info-strong" />
                )}
                <span className="flex flex-col text-left">
                  <span className="text-sm font-medium">
                    {mode === "private" ? "Private" : "Everyone"}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-normal",
                      mode === "private"
                        ? "text-text-error-strong"
                        : "text-text-info-strong",
                    )}
                  >
                    {mode === "private"
                      ? "Visible to only you"
                      : "Visible to everyone."}
                  </span>
                </span>
                {value.visibility === mode && !hasShares && (
                  <Check
                    aria-hidden
                    className="absolute -right-1 -top-1 size-4 rounded-full bg-fill-success-strong p-0.5 text-text-inverse-strong"
                  />
                )}
              </Button>
            ))}
          </div>
          <div className="relative">
            <Search
              aria-hidden
              className="absolute left-2 top-2.5 size-4 text-icon-neutral-weak"
            />
            <Input
              aria-label="Search user or group"
              placeholder="Search user or group"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 rounded-lg pl-8"
            />
          </div>
          {recent.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-text-neutral-weaker">Recently used:</p>
              <div className="flex flex-wrap gap-2">
                {options
                  .filter((o) => recent.includes(o.id))
                  .map((o, i) => (
                    <button
                      key={o.id}
                      type="button"
                      className={cn(
                        "rounded-full px-2 py-1 text-xs font-medium",
                        chipColors[i % chipColors.length],
                      )}
                      onClick={() => toggle(o.id, o.group)}
                    >
                      @{o.name}
                    </button>
                  ))}
              </div>
            </div>
          )}
          <div className="flex max-h-40 flex-col gap-2 overflow-y-auto">
            {options
              .filter((o) =>
                o.name.toLowerCase().includes(search.toLowerCase()),
              )
              .map((o) => (
                <label
                  key={`${o.group}:${o.id}`}
                  className="flex min-h-8 cursor-pointer items-center gap-2 text-sm text-text-neutral-weak"
                >
                  <input
                    type="checkbox"
                    checked={(o.group ? value.groups : value.people).includes(
                      o.id,
                    )}
                    onChange={() => toggle(o.id, o.group)}
                    className="size-3.5 accent-[var(--fill-brand-strong)]"
                  />
                  {o.group ? (
                    <span aria-hidden className="flex size-6 shrink-0 items-center justify-center rounded-full bg-fill-neutral-weak">
                      <Users className="size-3" />
                    </span>
                  ) : (
                    <span aria-hidden>
                      <UserAvatar alt="" name={o.name} userId={people.find((p) => p._id === o.id)?.user?._id} email={people.find((p) => p._id === o.id)?.email} size="sm" />
                    </span>
                  )}
                  {o.name}
                </label>
              ))}
            {loading && (
              <p role="status" className="text-xs text-text-neutral-weaker">
                Loading people and groups…
              </p>
            )}
            {error && (
              <p role="alert" className="text-xs text-text-error-strong">
                Couldn’t load people and groups. Try again.
              </p>
            )}
            {!loading &&
              !error &&
              !options.some((o) =>
                o.name.toLowerCase().includes(search.toLowerCase()),
              ) && (
                <p className="text-xs text-text-neutral-weaker">
                  No people or groups found.
                </p>
              )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
