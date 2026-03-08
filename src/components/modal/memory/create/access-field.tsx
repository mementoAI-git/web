"use client";

import { useState, useEffect, useRef } from "react";
import useSWR from "swr";
import { useModal } from "@/hooks/use-modal";
import { cn } from "@/utility";
import endpoint from "@/api/endpoint";
import { fetcher } from "@/api/fetcher";
import { PlusIcon } from "@/components/icons";

const DEBOUNCE_MS = 500;
const QUERY_MIN = 1;
const QUERY_MAX = 100;

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

interface SearchApiResponse {
  data?: SearchResultItem[];
  message?: string;
  status?: number;
}

interface AccessFieldProps {
  value: SearchResultItem[];
  onChange: (selected: SearchResultItem[]) => void;
}

export function AccessField({ value: selectedAccess, onChange }: AccessFieldProps) {
  const { push } = useModal();
  const [accessInput, setAccessInput] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showAccessDropdown, setShowAccessDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = accessInput.trim().slice(0, QUERY_MAX);
      setDebouncedQuery(trimmed);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [accessInput]);

  const searchKey =
    debouncedQuery.length >= QUERY_MIN
      ? `${endpoint.groupsSearch}?q=${encodeURIComponent(debouncedQuery)}`
      : null;

  const { data: searchResponse, isLoading: isSearchLoading } = useSWR<SearchApiResponse>(
    searchKey,
    fetcher,
    { revalidateOnFocus: false }
  );

  const searchResults: SearchResultItem[] = Array.isArray(searchResponse?.data)
    ? searchResponse.data
    : [];

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
    setShowAccessDropdown(false);
  };

  const removeAccess = (id: string) => {
    onChange(selectedAccess.filter((x) => x.id !== id));
  };

  const hasQuery = accessInput.trim().length >= QUERY_MIN;
  const showDropdown = showAccessDropdown;

  return (
    <div>
      <p className="font-inter text-sm font-medium text-gray-700 mb-2">
        Who has access to this story?{" "}
        <span className="text-gray-400 font-normal">(tag people or groups)</span>
      </p>
      <div
        ref={containerRef}
        className="relative flex flex-wrap gap-2 min-h-[48px] px-3 py-2 border border-gray-200 rounded-xl bg-white"
        onClick={(e) => e.stopPropagation()}
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
            selectedAccess.length === 0 ? "Type to search people or groups..." : ""
          }
          className="flex-1 min-w-[120px] outline-none font-inter text-sm text-gray-700 placeholder:text-gray-400"
        />
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-gray-100">
              <div className="flex-1 min-w-0 text-gray-500 text-sm">
                {!hasQuery ? (
                  "Type to search people or groups..."
                ) : isSearchLoading ? (
                  "Searching..."
                ) : searchResults.length === 0 ? (
                  "No groups or beneficiaries found"
                ) : null}
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
            {searchResults.length > 0 && (
              <div className="max-h-40 overflow-y-auto py-1">
                {searchResults.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => addAccess(item)}
                    disabled={selectedAccess.some((a) => a.id === item.id)}
                    className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none text-sm text-gray-700 text-left"
                  >
                    <div className="size-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600 shrink-0">
                      {item.name[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium leading-tight truncate">{item.name}</p>
                      <span
                        className={cn(
                          "text-[10px] font-medium uppercase tracking-wide",
                          item.source === "group"
                            ? "text-purple-600"
                            : "text-blue-600"
                        )}
                      >
                        {item.source === "group" ? "Group" : "Beneficiary"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
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
