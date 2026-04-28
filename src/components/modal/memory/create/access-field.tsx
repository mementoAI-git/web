"use client";

import { useState, useEffect, useRef, useMemo, useId } from "react";
import useSWR from "swr";
import { useModal } from "@/hooks/use-modal";
import { cn } from "@/utility";
import endpoint from "@/api/endpoint";
import { fetcher } from "@/api/fetcher";
import { PlusIcon } from "@/components/icons";
import type { IGroup, IBeneficiary } from "@/utility/interface";
import { GROUP_COLORS } from "@/utility/constant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const LIST_LIMIT = 100;

export type SearchResultItem = {
  id: string;
  name: string;
  source: "group" | "beneficiary";
  /** Color index (0-6) for groups; beneficiaries use 0 (blue) as default */
  color?: number;
};

const BENEFICIARY_DEFAULT_COLOR = 0;

interface AccessFieldProps {
  value: SearchResultItem[];
  onChange: (selected: SearchResultItem[]) => void;
}

function toSearchItem(g: IGroup): SearchResultItem {
  return { id: g._id, name: g.name, source: "group", color: g.color ?? 0 };
}

function toSearchItemFromBeneficiary(b: IBeneficiary): SearchResultItem {
  return { id: b._id ?? "", name: b.name, source: "beneficiary", color: BENEFICIARY_DEFAULT_COLOR };
}

function getColorClass(item: SearchResultItem): string {
  const idx = item.color ?? 0;
  return GROUP_COLORS[Math.min(idx, GROUP_COLORS.length - 1)];
}

export function AccessField({ value: selectedAccess, onChange }: AccessFieldProps) {
  const { push } = useModal();
  const accessInputId = useId();
  const [accessInput, setAccessInput] = useState("");
  const [showAccessDropdown, setShowAccessDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const groupsKey = showAccessDropdown ? `${endpoint.groups}?page=1&limit=${LIST_LIMIT}` : null;
  const beneficiariesKey = showAccessDropdown
    ? `${endpoint.beneficiaries}?page=1&limit=${LIST_LIMIT}`
    : null;

  const { data: groupsResponse } = useSWR(groupsKey, fetcher, { revalidateOnFocus: false });
  const { data: beneficiariesResponse } = useSWR(beneficiariesKey, fetcher, {
    revalidateOnFocus: false,
  });

  const allOptions: SearchResultItem[] = useMemo(() => {
    const groups: SearchResultItem[] = Array.isArray(groupsResponse?.data?.docs)
      ? groupsResponse.data.docs.map(toSearchItem)
      : [];
    const beneficiaries: SearchResultItem[] = Array.isArray(beneficiariesResponse?.data?.docs)
      ? beneficiariesResponse.data.docs
          .filter((b: IBeneficiary) => b._id)
          .map(toSearchItemFromBeneficiary)
      : [];
    return [...groups, ...beneficiaries];
  }, [groupsResponse?.data?.docs, beneficiariesResponse?.data?.docs]);

  const searchLower = accessInput.trim().toLowerCase();
  const filteredOptions = useMemo(() => {
    if (!searchLower) return allOptions;
    return allOptions.filter((item) => item.name.toLowerCase().includes(searchLower));
  }, [allOptions, searchLower]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowAccessDropdown(false);
      }
    };
    document.addEventListener("click", handleClickOutside, true);
    return () => document.removeEventListener("click", handleClickOutside, true);
  }, []);

  const addAccess = (item: SearchResultItem) => {
    if (selectedAccess.some((a) => a.id === item.id)) return;
    onChange([...selectedAccess, item]);
    setAccessInput("");
  };

  const removeAccess = (id: string) => {
    onChange(selectedAccess.filter((x) => x.id !== id));
  };

  return (
    <div>
      <Label htmlFor={accessInputId} className="font-inter font-medium text-text-neutral-strong mb-2">
        Who has access to this story?{" "}
        <span className="text-text-neutral-weaker font-normal">(tag people or groups)</span>
      </Label>
      <div
        ref={containerRef}
        className={cn(
          "relative flex flex-wrap gap-2 min-h-[48px] px-3 py-2 rounded-xl bg-v3-bg cursor-text",
          "border border-stroke-neutral-weak transition-[color,box-shadow,border-color]",
          "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-inset focus-within:ring-ring/50",
        )}
        onClick={(e) => {
          e.stopPropagation();
          setShowAccessDropdown(true);
        }}
      >
        {selectedAccess.map((a) => (
          <span
            key={a.id}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-full border font-inter text-xs font-medium",
              getColorClass(a),
            )}
          >
            @{a.name}
            <button
              type="button"
              onClick={() => removeAccess(a.id)}
              className="opacity-60 hover:opacity-100 ml-0.5 leading-none"
            >
              ×
            </button>
          </span>
        ))}
        <Input
          id={accessInputId}
          value={accessInput}
          onChange={(e) => {
            setAccessInput(e.target.value);
            setShowAccessDropdown(true);
          }}
          onFocus={() => setShowAccessDropdown(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setShowAccessDropdown(false);
          }}
          placeholder={selectedAccess.length === 0 ? "Select people or groups..." : ""}
          className={cn(
            "flex-1 min-w-[120px] h-8 min-h-0 border-0 bg-transparent shadow-none rounded-none px-0 py-1",
            "focus-visible:ring-0 font-inter text-sm text-text-neutral-strong placeholder:text-neutral-weak",
          )}
        />
        {showAccessDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1 z-20 overflow-hidden rounded-xl border border-stroke-neutral-weak bg-popover text-popover-foreground shadow-lg">
            <div className="flex flex-wrap gap-2 p-3 max-h-48 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <p className="text-sm text-text-neutral-weaker py-1">
                  {allOptions.length === 0
                    ? "No groups or beneficiaries yet. Create a group to get started."
                    : "No matches"}
                </p>
              ) : (
                filteredOptions.map((item) => {
                  const isSelected = selectedAccess.some((a) => a.id === item.id);
                  const colorClass = getColorClass(item);
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => addAccess(item)}
                      disabled={isSelected}
                      className={cn(
                        "flex items-center gap-1 px-2.5 py-1 rounded-full border font-inter text-xs font-medium transition-opacity hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none",
                        colorClass,
                      )}
                    >
                      @{item.name}
                    </button>
                  );
                })
              )}
            </div>
            <div className="flex items-center justify-between gap-3 px-3 py-[3px] border-t border-stroke-neutral-weaker bg-fill-neutral-weaker">
              <div className="flex-1 min-w-0 text-text-neutral-weak text-sm">
                {accessInput.trim() && filteredOptions.length === 0
                  ? "No matches"
                  : !accessInput.trim() && allOptions.length === 0
                    ? "No groups or beneficiaries yet"
                    : null}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => {
                  setShowAccessDropdown(false);
                  push?.("add-group");
                }}
                className="shrink-0 gap-1.5 rounded-lg font-medium text-text-neutral-strong"
              >
                <PlusIcon width={12} height={12} />
                New Group
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Build create-memory payload with groups and beneficiaries from selected access items. */
// eslint-disable-next-line react-refresh/only-export-components
export function buildCreateMemoryPayload(
  title: string,
  body: string,
  tags: string[],
  status: string,
  selected: SearchResultItem[],
  extra: Record<string, unknown> = {},
): Record<string, unknown> {
  const groupIds = selected.filter((s) => s.source === "group").map((s) => s.id);
  const beneficiaryIds = selected
    .filter((s) => s.source === "beneficiary")
    .map((s) => s.id);
  const payload: Record<string, unknown> = {
    title,
    body,
    status,
    tags,
    ...extra,
  };
  if (groupIds.length > 0) payload.groups = groupIds;
  if (beneficiaryIds.length > 0) payload.beneficiaries = beneficiaryIds;
  return payload;
}
