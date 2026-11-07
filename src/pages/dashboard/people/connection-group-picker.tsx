import { useState } from "react";
import useSWR from "swr";
import { Check } from "lucide-react";
import { groupsListKey, groupsListFetcher } from "@/api/groups";
import { Button } from "@/components/ui/button";
import { GROUP_COLORS } from "@/utility/constant";
import { cn } from "@/utility";
import type { GroupSearchResultItem } from "@/components/modal/beneficiary/add-beneficiary/select-group";

export function ConnectionGroupPicker({
  value,
  onChange,
  disabled,
}: {
  value: GroupSearchResultItem[];
  onChange: (groups: GroupSearchResultItem[]) => void;
  disabled: boolean;
}) {
  const [page, setPage] = useState(1);
  const { data, error, isLoading, mutate } = useSWR(
    groupsListKey(page),
    groupsListFetcher,
    { shouldRetryOnError: false },
  );
  const available: GroupSearchResultItem[] = (data?.docs ?? []).map(
    (group) => ({
      id: group._id,
      name: group.name,
      color: group.color,
      source: "group",
    }),
  );
  const cards = [
    ...value.filter(
      (selected) => !available.some((group) => group.id === selected.id),
    ),
    ...available,
  ];
  return (
    <fieldset disabled={disabled} className="space-y-3">
      <legend className="text-sm font-medium">Groups</legend>
      <div className="flex flex-wrap gap-2">
        {cards.map((group) => {
          const selected = value.some((item) => item.id === group.id);
          return (
            <button
              key={group.id}
              type="button"
              aria-pressed={selected}
              className={cn(
                "people-control inline-flex min-h-6 max-w-full cursor-pointer items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium leading-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50",
                GROUP_COLORS[
                  Math.max(
                    0,
                    Math.min(group.color ?? 0, GROUP_COLORS.length - 1),
                  )
                ],
              )}
              onClick={() =>
                onChange(
                  selected
                    ? value.filter((item) => item.id !== group.id)
                    : [...value, group],
                )
              }
            >
              {selected && <Check className="size-3 shrink-0" aria-hidden />}
              <span className="truncate">{group.name}</span>
            </button>
          );
        })}
        {isLoading && (
          <p role="status" className="text-sm text-text-neutral-weak">
            Loading groups…
          </p>
        )}
        {error && (
          <Button variant="outline" size="sm" onClick={() => void mutate()}>
            Retry loading groups
          </Button>
        )}
        {!isLoading && !error && !cards.length && (
          <p className="text-sm text-text-neutral-weak">No groups yet.</p>
        )}
      </div>
      {(data?.totalPages ?? 1) > 1 && (
        <div className="flex justify-between gap-2">
          <Button
            size="sm"
            variant="ghost"
            disabled={disabled || page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous groups
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={disabled || page >= (data?.totalPages ?? 1)}
            onClick={() => setPage(page + 1)}
          >
            More groups
          </Button>
        </div>
      )}
    </fieldset>
  );
}
