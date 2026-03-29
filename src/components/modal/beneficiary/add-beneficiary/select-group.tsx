"use client";

import { useState, useEffect, useRef } from "react";
import useSWR from "swr";
import { X } from "lucide-react";
import { cn } from "@/utility";
import endpoint from "@/api/endpoint";
import { fetcher } from "@/api/fetcher";
import { GROUP_COLORS } from "@/utility/constant";

const DEBOUNCE_MS = 500;
const QUERY_MIN = 1;
const QUERY_MAX = 100;

export type GroupSearchResultItem = {
  id: string;
  name: string;
  source: "group" | "beneficiary";
  color?: number;
};

interface SearchApiResponse {
  data?: GroupSearchResultItem[];
  message?: string;
  status?: number;
}

interface SelectGroupProps {
  value: GroupSearchResultItem[];
  onChange: (selected: GroupSearchResultItem[]) => void;
  label?: React.ReactNode;
  labelHint?: React.ReactNode;
  placeholder?: string;
  emptyMessage?: string;
  noResultsMessage?: string;
}

const DEFAULT_PLACEHOLDER = "Search groups…";
const DEFAULT_EMPTY_MESSAGE = "Type to search groups…";
const DEFAULT_NO_RESULTS_MESSAGE = "No groups found.";

export function SelectGroup({
  value: selectedGroups,
  onChange,
  label,
  labelHint,
  placeholder = DEFAULT_PLACEHOLDER,
  emptyMessage = DEFAULT_EMPTY_MESSAGE,
  noResultsMessage = DEFAULT_NO_RESULTS_MESSAGE,
}: SelectGroupProps) {
  const [input, setInput] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = input.trim().slice(0, QUERY_MAX);
      setDebouncedQuery(trimmed);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [input]);

  const searchKey =
    debouncedQuery.length >= QUERY_MIN
      ? `${endpoint.groupsSearch}?q=${encodeURIComponent(debouncedQuery)}&resource=group`
      : null;

  const { data: searchResponse, isLoading: isSearchLoading } = useSWR<SearchApiResponse>(
    searchKey,
    fetcher,
    { revalidateOnFocus: false },
  );

  const searchResults: GroupSearchResultItem[] = Array.isArray(searchResponse?.data)
    ? searchResponse.data
    : [];

  useEffect(() => {
    const handleMouseDownOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleMouseDownOutside);
    return () => document.removeEventListener("mousedown", handleMouseDownOutside);
  }, []);

  const addGroup = (item: GroupSearchResultItem) => {
    if (selectedGroups.some((g) => g.id === item.id)) return;
    onChange([...selectedGroups, item]);
    setInput("");
    setShowDropdown(false);
  };

  const removeGroup = (id: string) => {
    onChange(selectedGroups.filter((x) => x.id !== id));
  };

  const hasQuery = input.trim().length >= QUERY_MIN;

  return (
    <div className="flex flex-col gap-1.5">
      {(label != null || labelHint != null) && (
        <p className="font-inter text-xs text-v3-text-weak">
          {label}
          {labelHint != null && (
            <span className="text-v3-text-weaker font-normal"> {labelHint}</span>
          )}
        </p>
      )}
      <div ref={containerRef} className="relative">
        <div
          className={cn(
            "flex min-h-10 flex-wrap items-center gap-1.5 rounded-xl border px-3 py-2 transition-colors",
            showDropdown
              ? "border-v3-stroke-strong bg-white"
              : "border-v3-stroke-weak bg-white hover:border-v3-stroke-strong",
          )}
        >
          {selectedGroups.map((g) => {
            const colorClass = GROUP_COLORS[Math.min(g.color ?? 0, GROUP_COLORS.length - 1)];
            return (
              <span
                key={g.id}
                className={cn(
                  "flex items-center gap-1 rounded-full border px-2 py-0.5 font-inter text-xs font-medium",
                  colorClass,
                )}
              >
                {g.name}
                <button
                  type="button"
                  onClick={() => removeGroup(g.id)}
                  className="ml-0.5 flex items-center opacity-60 hover:opacity-100"
                  aria-label={`Remove ${g.name}`}
                >
                  <X size={10} strokeWidth={2} />
                </button>
              </span>
            );
          })}
          <input
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setShowDropdown(false);
            }}
            placeholder={selectedGroups.length === 0 ? placeholder : ""}
            className="min-w-[120px] flex-1 bg-transparent font-inter text-sm text-v3-text-strong outline-none placeholder:text-v3-text-weaker"
          />
        </div>

        {showDropdown && (
          <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-xl border border-v3-stroke-weak bg-white py-1 shadow-lg">
            {!hasQuery ? (
              <p className="px-3 py-4 font-inter text-sm text-v3-text-weaker">{emptyMessage}</p>
            ) : isSearchLoading ? (
              <p className="px-3 py-4 font-inter text-sm text-v3-text-weaker">Searching…</p>
            ) : searchResults.length === 0 ? (
              <p className="px-3 py-4 font-inter text-sm text-v3-text-weaker">{noResultsMessage}</p>
            ) : (
              searchResults.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => addGroup(item)}
                  disabled={selectedGroups.some((g) => g.id === item.id)}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-v3-fill-weaker disabled:pointer-events-none disabled:opacity-40"
                >
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-v3-fill-weak font-inter text-xs font-semibold text-v3-text-strong">
                    {item.name[0]?.toUpperCase()}
                  </div>
                  <span className="min-w-0 flex-1 truncate font-inter text-sm font-medium text-v3-text-strong">
                    {item.name}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
