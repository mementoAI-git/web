"use client";

import { useState, useEffect, useRef, useMemo, useId } from "react";
import useSWR from "swr";
import { ChevronDown, ChevronUp, Globe, Lock, Users } from "lucide-react";
import { useModal } from "@/hooks/use-modal";
import { cn } from "@/utility";
import endpoint from "@/api/endpoint";
import { paginatedResponseFetcher } from "@/api/domain-fetchers";
import { PlusIcon } from "@/components/icons";
import type { IGroup, IBeneficiary } from "@/utility/interface";
import { GROUP_COLORS } from "@/utility/constant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SearchResultItem } from "./access-field-types";
import { stableColorIndexFromId, toBeneficiarySearchItem } from "./beneficiary-to-access-item";

const LIST_LIMIT = 100;

/** Neutral chip for groups in this control (settings may still use group color elsewhere). */
const GROUP_ACCESS_CHIP_CLASS =
  "bg-fill-neutral-weaker text-text-neutral-strong border-stroke-neutral-weak";

export type { SearchResultItem } from "./access-field-types";

/** Stored on the memory as `visibility`; must align with API. */
export type MemoryShareAudience = "private" | "everyone";

interface AccessFieldProps {
  value: SearchResultItem[];
  onChange: (selected: SearchResultItem[]) => void;
  shareAudience: MemoryShareAudience;
  onShareAudienceChange: (audience: MemoryShareAudience) => void;
  variant?: "default" | "panel";
}

function toSearchItem(g: IGroup): SearchResultItem {
  return { id: g._id, name: g.name, source: "group" };
}

function getColorClass(item: SearchResultItem): string {
  if (item.source === "group") return GROUP_ACCESS_CHIP_CLASS;
  const idx = item.color ?? stableColorIndexFromId(item.id);
  return GROUP_COLORS[Math.min(idx, GROUP_COLORS.length - 1)];
}

export function AccessField({
  value: selectedAccess,
  onChange,
  shareAudience,
  onShareAudienceChange,
  variant = "default",
}: AccessFieldProps) {
  const { push } = useModal();
  const accessInputId = useId();
  const [accessInput, setAccessInput] = useState("");
  const [showAccessDropdown, setShowAccessDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const groupsKey = showAccessDropdown ? `${endpoint.groups}?page=1&limit=${LIST_LIMIT}` : null;
  const beneficiariesKey = showAccessDropdown
    ? `${endpoint.beneficiaries}?page=1&limit=${LIST_LIMIT}`
    : null;

  const { data: groupsResponse } = useSWR(
    groupsKey,
    paginatedResponseFetcher<IGroup>,
    { revalidateOnFocus: false },
  );
  const { data: beneficiariesResponse } = useSWR(
    beneficiariesKey,
    paginatedResponseFetcher<IBeneficiary>,
    {
    revalidateOnFocus: false,
    },
  );

  const allOptions: SearchResultItem[] = useMemo(() => {
    const groups: SearchResultItem[] = Array.isArray(groupsResponse?.data?.docs)
      ? groupsResponse.data.docs.map(toSearchItem)
      : [];
    const beneficiaries: SearchResultItem[] = Array.isArray(beneficiariesResponse?.data?.docs)
      ? beneficiariesResponse.data.docs
          .filter((b: IBeneficiary) => b._id)
          .map((b: IBeneficiary) => toBeneficiarySearchItem(b))
      : [];
    return [...groups, ...beneficiaries];
  }, [groupsResponse?.data?.docs, beneficiariesResponse?.data?.docs]);

  const searchLower = accessInput.trim().toLowerCase();
  const filteredOptions = useMemo(() => {
    if (!searchLower) return allOptions;
    return allOptions.filter((item) => item.name.toLowerCase().includes(searchLower));
  }, [allOptions, searchLower]);

  const visibilityLabel = useMemo(() => {
    if (selectedAccess.length === 1) return `Shared with ${selectedAccess[0].name}`;
    if (selectedAccess.length > 1) {
      return `Shared with ${selectedAccess.length} people and groups`;
    }
    return shareAudience === "everyone" ? "Visible to everyone" : "Private — only you";
  }, [selectedAccess, shareAudience]);

  const summaryIcon =
    selectedAccess.length > 0 ? (
      <Users className="size-4 shrink-0 text-text-neutral-weaker" aria-hidden />
    ) : shareAudience === "everyone" ? (
      <Globe className="size-4 shrink-0 text-text-neutral-weaker" aria-hidden />
    ) : (
      <Lock
        className={cn(
          "size-4 shrink-0",
          variant === "panel" ? "text-[#ff7a70]" : "text-text-neutral-weaker",
        )}
        aria-hidden
      />
    );

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
    onShareAudienceChange("private");
    onChange([...selectedAccess, item]);
    setAccessInput("");
  };

  const removeAccess = (id: string) => {
    const next = selectedAccess.filter((x) => x.id !== id);
    onChange(next);
    if (next.length === 0) onShareAudienceChange("private");
  };

  const setPrivate = () => {
    onChange([]);
    onShareAudienceChange("private");
    setAccessInput("");
  };

  const setEveryone = () => {
    onChange([]);
    onShareAudienceChange("everyone");
    setAccessInput("");
  };

  return (
    <div className="space-y-2">
      <div>
        <Label
          htmlFor={accessInputId}
          className={cn(
            variant === "panel"
              ? "font-geist text-sm font-normal text-[rgba(15,7,0,0.9)]"
              : "font-inter font-medium text-text-neutral-strong",
          )}
        >
          {variant === "panel" ? "Who can see this story?" : "Who can see this story?"}
        </Label>
        <p className="mt-1.5 font-inter text-xs leading-relaxed text-text-neutral-weaker">
          {variant === "panel" ? (
            <>
              Stories are visible to all beneficiaries by default. Choose{" "}
              <span className="font-semibold text-[#c73a3a]">Private</span> to keep them hidden from all
              your beneficiaries, or search below to specify people and groups you want to share with.
            </>
          ) : (
            <>
              Stories are <span className="text-text-neutral-strong">private by default</span>
              —only you can see them. Choose{" "}
              <span className="text-text-neutral-strong">Everyone</span> to share openly, or search below for{" "}
              <span className="text-text-neutral-strong">specific people and groups</span>.
            </>
          )}
        </p>
      </div>
      <div ref={containerRef} className="relative">
        <div
          className={cn(
            variant === "panel"
              ? "rounded-[8px] border border-stroke-neutral-weak bg-white transition-[color,box-shadow,border-color]"
              : "rounded-xl border border-stroke-neutral-weak bg-fill-neutral-weaker/40 transition-[color,box-shadow,border-color]",
            "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-inset focus-within:ring-ring/50",
          )}
        >
          <button
            type="button"
            id={accessInputId}
            aria-expanded={showAccessDropdown}
            aria-haspopup="listbox"
            onClick={(e) => {
              e.stopPropagation();
              setShowAccessDropdown((o) => !o);
            }}
            className={cn(
              "flex w-full items-center gap-2.5 text-left text-sm text-text-neutral-strong",
              variant === "panel"
                ? "px-3 py-2 font-geist hover:bg-[#faf8f5]"
                : "px-3 py-2.5 font-inter hover:bg-fill-neutral-weaker/60",
            )}
          >
            {summaryIcon}
            <span className="min-w-0 flex-1 truncate">{visibilityLabel}</span>
            {showAccessDropdown ? (
              <ChevronUp className="size-3.5 shrink-0 opacity-70" aria-hidden />
            ) : (
              <ChevronDown className="size-3.5 shrink-0 opacity-70" aria-hidden />
            )}
          </button>
          {selectedAccess.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 border-t border-stroke-neutral-weaker bg-v3-bg/50 px-3 py-2">
              {selectedAccess.map((a) => (
                <span
                  key={a.id}
                  className={cn(
                    "flex items-center gap-1 rounded-full border px-2.5 py-1 font-inter text-xs font-medium",
                    getColorClass(a),
                  )}
                >
                  @{a.name}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeAccess(a.id);
                    }}
                    className="ml-0.5 leading-none opacity-60 hover:opacity-100"
                    aria-label={`Remove ${a.name}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : null}
        </div>
        {showAccessDropdown ? (
          <div
            className="absolute top-full left-0 right-0 z-20 mt-1 overflow-hidden rounded-xl border border-stroke-neutral-weak bg-popover text-popover-foreground shadow-lg"
            role="listbox"
            aria-label="Sharing options"
          >
            <div className="space-y-0.5 border-b border-stroke-neutral-weaker p-2">
              <button
                type="button"
                role="option"
                aria-selected={selectedAccess.length === 0 && shareAudience === "private"}
                onClick={() => {
                  setPrivate();
                }}
                className={cn(
                  "flex w-full flex-col gap-0.5 rounded-lg px-3 py-2 text-left font-inter transition-colors",
                  selectedAccess.length === 0 && shareAudience === "private"
                    ? "bg-fill-brand-weak text-text-brand-strong"
                    : "hover:bg-fill-neutral-weaker text-text-neutral-strong",
                )}
              >
                <span className="text-sm font-medium">Private</span>
                <span
                  className={cn(
                    "text-xs",
                    selectedAccess.length === 0 && shareAudience === "private"
                      ? "text-text-brand-strong/90"
                      : "text-text-neutral-weaker",
                  )}
                >
                  Only you can see this story
                </span>
              </button>
              <button
                type="button"
                role="option"
                aria-selected={selectedAccess.length === 0 && shareAudience === "everyone"}
                onClick={() => {
                  setEveryone();
                }}
                className={cn(
                  "flex w-full flex-col gap-0.5 rounded-lg px-3 py-2 text-left font-inter transition-colors",
                  selectedAccess.length === 0 && shareAudience === "everyone"
                    ? "bg-fill-brand-weak text-text-brand-strong"
                    : "hover:bg-fill-neutral-weaker text-text-neutral-strong",
                )}
              >
                <span className="text-sm font-medium">Everyone</span>
                <span
                  className={cn(
                    "text-xs",
                    selectedAccess.length === 0 && shareAudience === "everyone"
                      ? "text-text-brand-strong/90"
                      : "text-text-neutral-weaker",
                  )}
                >
                  Anyone can view this story
                </span>
              </button>
            </div>
            <div className="px-3 pt-3 pb-1">
              <p className="mb-2 font-inter text-[11px] font-medium uppercase tracking-wide text-text-neutral-weaker">
                Specific people or groups
              </p>
              <Input
                value={accessInput}
                onChange={(e) => setAccessInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setShowAccessDropdown(false);
                }}
                placeholder="Search…"
                className={cn(
                  "h-9 rounded-lg border-stroke-neutral-weak bg-v3-bg font-inter text-sm text-text-neutral-strong",
                  "placeholder:text-text-neutral-weaker",
                )}
              />
            </div>
            <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto px-3 pb-2 pt-1">
              {filteredOptions.length === 0 ? (
                <p className="w-full py-1 font-inter text-sm text-text-neutral-weaker">
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
                        "flex items-center gap-1 rounded-full border px-2.5 py-1 font-inter text-xs font-medium transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50",
                        colorClass,
                      )}
                    >
                      @{item.name}
                    </button>
                  );
                })
              )}
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-stroke-neutral-weaker bg-fill-neutral-weaker px-3 py-[3px]">
              <div className="min-w-0 flex-1 text-sm text-text-neutral-weak">
                {accessInput.trim() && filteredOptions.length === 0 ? "No matches" : null}
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
        ) : null}
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
  shareAudience: MemoryShareAudience,
  extra: Record<string, unknown> = {},
): Record<string, unknown> {
  const groupIds = selected.filter((s) => s.source === "group").map((s) => s.id);
  const beneficiaryIds = selected
    .filter((s) => s.source === "beneficiary")
    .map((s) => s.id);
  const hasSpecificShares = groupIds.length > 0 || beneficiaryIds.length > 0;
  const visibility: MemoryShareAudience = hasSpecificShares ? "private" : shareAudience;
  const payload: Record<string, unknown> = {
    title,
    body,
    status,
    tags,
    visibility,
    ...extra,
  };
  if (groupIds.length > 0) payload.groups = groupIds;
  if (beneficiaryIds.length > 0) payload.beneficiaries = beneficiaryIds;
  return payload;
}
