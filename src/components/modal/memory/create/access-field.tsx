"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import useSWR from "swr";
import { useModal } from "@/hooks/use-modal";
import { cn } from "@/utility";
import endpoint from "@/api/endpoint";
import { fetcher } from "@/api/fetcher";
import { PlusIcon } from "@/components/icons";
import type { IGroup, IBeneficiary } from "@/utility/interface";

const LIST_LIMIT = 100;

export type SearchResultItem = {
  id: string;
  name: string;
  source: "group" | "beneficiary";
};

const chipColors = [
  "bg-blue-50 text-blue-600 border-blue-100",
  "bg-green-50 text-green-600 border-green-100",
  "bg-orange-50 text-orange-600 border-orange-100",
  "bg-purple-50 text-purple-600 border-purple-100",
  "bg-pink-50 text-pink-600 border-pink-100",
];

interface AccessFieldProps {
  value: SearchResultItem[];
  onChange: (selected: SearchResultItem[]) => void;
}

function toSearchItem(g: IGroup): SearchResultItem {
  return { id: g._id, name: g.name, source: "group" };
}

function toSearchItemFromBeneficiary(b: IBeneficiary): SearchResultItem {
  return { id: b._id ?? "", name: b.name, source: "beneficiary" };
}

export function AccessField({ value: selectedAccess, onChange }: AccessFieldProps) {
  const { push } = useModal();
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
      <p className="font-inter text-sm font-medium text-gray-700 mb-2">
        Who has access to this story?{" "}
        <span className="text-gray-400 font-normal">(tag people or groups)</span>
      </p>
      <div
        ref={containerRef}
        className="relative flex flex-wrap gap-2 min-h-[48px] px-3 py-2 border border-gray-200 rounded-xl bg-white cursor-text"
        onClick={(e) => {
          e.stopPropagation();
          setShowAccessDropdown(true);
        }}
      >
        {selectedAccess.map((a, i) => (
          <span
            key={a.id}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-full border font-inter text-xs font-medium",
              chipColors[i % chipColors.length]
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
        <input
          value={accessInput}
          onChange={(e) => {
            setAccessInput(e.target.value);
            setShowAccessDropdown(true);
          }}
          onFocus={() => setShowAccessDropdown(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setShowAccessDropdown(false);
          }}
          placeholder={
            selectedAccess.length === 0 ? "Select people or groups..." : ""
          }
          className="flex-1 min-w-[120px] outline-none font-inter text-sm text-gray-700 placeholder:text-gray-400"
        />
        {showAccessDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-gray-100">
              <div className="flex-1 min-w-0 text-gray-500 text-sm">
                {accessInput.trim() && filteredOptions.length === 0
                  ? "No matches"
                  : !accessInput.trim() && allOptions.length === 0
                    ? "No groups or beneficiaries yet"
                    : null}
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAccessDropdown(false);
                  push?.("add-group");
                }}
                className="shrink-0 flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <PlusIcon width={12} height={12} />
                New Group
              </button>
            </div>
            <div className="flex flex-wrap gap-2 p-3 max-h-48 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <p className="text-sm text-gray-400 py-1">
                  {allOptions.length === 0
                    ? "No groups or beneficiaries yet. Create a group to get started."
                    : "No matches"}
                </p>
              ) : (
                filteredOptions.map((item) => {
                const isSelected = selectedAccess.some((a) => a.id === item.id);
                const colorClass =
                  item.source === "group"
                    ? "bg-purple-50 text-purple-600 border-purple-100"
                    : "bg-blue-50 text-blue-600 border-blue-100";
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => addAccess(item)}
                    disabled={isSelected}
                    className={cn(
                      "flex items-center gap-1 px-2.5 py-1 rounded-full border font-inter text-xs font-medium transition-opacity hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none",
                      colorClass
                    )}
                  >
                    @{item.name}
                  </button>
                );
              })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Build create-memory payload with groups and beneficiaries from selected access items. */
export function buildCreateMemoryPayload(
  title: string,
  body: string,
  tags: string[],
  status: string,
  selected: SearchResultItem[],
  extra: Record<string, unknown> = {}
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
