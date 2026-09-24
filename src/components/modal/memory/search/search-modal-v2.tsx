import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Sheet } from "react-modal-sheet";
import endpoint from "@/api/endpoint";
import Spinner from "@/components/spinner";
import { getRecentMemories, isEmpty } from "@/utility";
import { useModal } from "@/hooks/use-modal";
import { useStore } from "@/hooks/use-store";
import useSWR from "swr";
import { SearchIcon } from "@/components/icons";
import { X } from "lucide-react";
import SearchItem from "./search-item";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
} from "@/components/ui/command";

function SearchModalContent() {
  const { user } = useStore();
  const [recentMemories, setRecentMemories] = useState([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const recent = getRecentMemories(user?.email);
    setRecentMemories(recent);
  }, [user?.email]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const url = `${endpoint.memories}?search=${encodeURIComponent(debouncedSearch.trim())}`;

  const {
    data: searchData,
    isLoading,
    isValidating,
  } = useSWR(debouncedSearch.trim() ? url : null, {
    revalidateOnFocus: false,
    keepPreviousData: true,
  });
  const docs = searchData?.data?.docs;
  const searchResults = useMemo(() => docs ?? [], [docs]);

  const showRecent = !debouncedSearch.trim();
  const showEmpty = debouncedSearch.trim()
    ? !isLoading && isEmpty(searchResults)
    : isEmpty(recentMemories);

  const handleClearSearch = useCallback(() => {
    setSearch("");
    setDebouncedSearch("");
    inputRef.current?.focus();
  }, []);

  const isSearching =
    Boolean(debouncedSearch.trim()) && (isLoading || isValidating);
  const visibleMemories = showRecent ? recentMemories : searchResults;

  return (
    <Command
      label="Search memories"
      shouldFilter={false}
      defaultValue="__memory-search-no-selection__"
      className="flex size-full flex-col rounded-none bg-background p-0"
    >
      <div
        data-slot="memory-search-header"
        className="relative border-b border-v3-stroke-weak px-3 py-4 [&_[data-slot=command-input-wrapper]]:p-0"
      >
        <CommandInput
          ref={inputRef}
          aria-label="Search memories"
          placeholder="Start searching..."
          className="h-full pr-10 font-inter text-sm text-v3-text-strong placeholder:text-v3-text-weaker"
          value={search}
          onValueChange={setSearch}
          autoFocus
        />
        {Boolean(search) && !isSearching ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={handleClearSearch}
            className="absolute right-7 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-v3-text-weak hover:bg-v3-fill-weak hover:text-v3-text-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v3-brand-strong active:scale-[0.97]"
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        ) : null}
        {isSearching ? (
          <Spinner
            loading
            className="absolute right-7 top-1/2 !size-5 -translate-y-1/2 !text-v3-text-weak"
          />
        ) : null}
      </div>

      <CommandList
        aria-label="Search results"
        className="h-full min-h-0 max-h-none flex-1 overflow-y-auto px-3 py-3"
      >
        {showEmpty ? (
          <CommandEmpty className="flex min-h-64 items-center justify-center py-10">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="mb-3 rounded-full bg-v3-fill-weaker p-3">
                <SearchIcon
                  width={32}
                  height={32}
                  className="text-v3-text-weak"
                  aria-hidden
                />
              </div>
              <div className="mb-2 font-inter text-base font-semibold text-v3-text-strong">
                {showRecent ? "No recent memories" : "No memories found"}
              </div>
              <div className="max-w-xs font-inter text-sm text-v3-text-weak">
                {showRecent
                  ? "Your recently opened memories will appear here."
                  : "Try searching for a different keyword."}
              </div>
            </div>
          </CommandEmpty>
        ) : null}

        {!showEmpty ? (
          <CommandGroup
            heading={
              showRecent
                ? "Recently opened"
                : `Stories · ${searchResults.length} ${searchResults.length === 1 ? "result" : "results"}`
            }
            className="p-0 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-2 [&_[cmdk-group-heading]]:pt-1 [&_[cmdk-group-heading]]:font-inter [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-v3-text-weak [&_[cmdk-group-items]]:flex [&_[cmdk-group-items]]:flex-col [&_[cmdk-group-items]]:gap-3"
          >
            {visibleMemories.map((memory) => (
              <SearchItem
                key={memory._id}
                memory={memory}
                searchTerm={showRecent ? "" : search.trim()}
              />
            ))}
          </CommandGroup>
        ) : null}
      </CommandList>
    </Command>
  );
}

interface SearchMemoriesV2Props {
  isMobile?: boolean;
}

export function SearchMemoriesV2({ isMobile = false }: SearchMemoriesV2Props) {
  const { close } = useModal();

  if (!isMobile) {
    return (
      <div
        data-slot="memory-search-backdrop"
        className="flex h-full w-full items-center justify-center"
        onClick={() => close?.("search-memory")}
      >
        <div
          data-slot="memory-search-panel"
          className="h-[min(520px,calc(100dvh-3rem))] w-[min(640px,calc(100vw-3rem))] overflow-hidden rounded-2xl border border-v3-stroke-weak bg-background shadow-[0px_8px_40px_var(--brown-100)]"
          onClick={(e) => e.stopPropagation()}
        >
          <SearchModalContent />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <Sheet
        detent="content"
        className="block"
        isOpen
        onClose={() => close?.("search-memory")}
        snapPoints={[0, 0.8]}
      >
        <Sheet.Container className="h-[80dvh] max-h-[80dvh] overflow-hidden bg-background">
          <Sheet.Header className="rounded-3xl bg-background" />
          <Sheet.Content className="h-full min-h-0 overflow-hidden overscroll-contain bg-background px-0 pb-6">
            <SearchModalContent />
          </Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop />
      </Sheet>
    </div>
  );
}
