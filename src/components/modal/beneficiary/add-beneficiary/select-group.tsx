"use client";

import { useState, useEffect, useRef } from "react";
import useSWR from "swr";
import { cn } from "@/utility";
import endpoint from "@/api/endpoint";
import { fetcher } from "@/api/fetcher";

const DEBOUNCE_MS = 500;
const QUERY_MIN = 1;
const QUERY_MAX = 100;

export type GroupSearchResultItem = {
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
  data?: GroupSearchResultItem[];
  message?: string;
  status?: number;
}

interface SelectGroupProps {
  value: GroupSearchResultItem[];
  onChange: (selected: GroupSearchResultItem[]) => void;
  /** Optional label above the field */
  label?: React.ReactNode;
  /** Optional hint in parentheses after the label */
  labelHint?: React.ReactNode;
  /** Placeholder when no items selected */
  placeholder?: string;
  /** Empty state when query is too short */
  emptyMessage?: string;
  /** Message when no results */
  noResultsMessage?: string;
}

const DEFAULT_LABEL = "Group";
const DEFAULT_PLACEHOLDER = "Type to search groups...";
const DEFAULT_EMPTY_MESSAGE = "Type to search groups...";
const DEFAULT_NO_RESULTS_MESSAGE = "No groups found. Try a different search.";

export function SelectGroup({
  value: selectedGroups,
  onChange,
  label = DEFAULT_LABEL,
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
    { revalidateOnFocus: false }
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
    <div>
      <p className="font-inter text-sm font-medium text-gray-700 mb-2">
        {label}
        {labelHint != null && (
          <span className="text-gray-400 font-normal"> {labelHint}</span>
        )}
      </p>
      <div
        ref={containerRef}
        className="relative flex flex-wrap gap-2 min-h-[48px] px-3 py-2 border border-gray-200 rounded-xl bg-white"
      >
        {selectedGroups.map((g, i) => (
          <span
            key={g.id}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-full border font-inter text-xs font-medium",
              chipColors[i % chipColors.length]
            )}
          >
            @{g.name}
            <button
              type="button"
              onClick={() => removeGroup(g.id)}
              className="opacity-60 hover:opacity-100 ml-0.5 leading-none"
            >
              ×
            </button>
          </span>
        ))}
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
          className="flex-1 min-w-[120px] outline-none font-inter text-sm text-gray-700 placeholder:text-gray-400"
        />
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 max-h-48 overflow-y-auto">
            {!hasQuery ? (
              <div className="px-3 py-4 text-gray-500 text-sm">
                {emptyMessage}
              </div>
            ) : isSearchLoading ? (
              <div className="flex items-center justify-center py-4 text-gray-500 text-sm">
                Searching...
              </div>
            ) : searchResults.length === 0 ? (
              <div className="px-3 py-4 text-gray-500 text-sm">
                {noResultsMessage}
              </div>
            ) : (
              searchResults.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => addGroup(item)}
                  disabled={selectedGroups.some((g) => g.id === item.id)}
                  className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none text-sm text-gray-700 text-left"
                >
                  <div className="size-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600 shrink-0">
                    {item.name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium leading-tight truncate">{item.name}</p>                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
