import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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

function SearchModalContent() {
  const { user } = useStore();
  const { close } = useModal();
  const navigate = useNavigate();
  const [recentMemories, setRecentMemories] = useState([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const recent = getRecentMemories(user?.email);
    setRecentMemories(recent);
  }, [user?.email]);

  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setActiveIndex(-1);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const url = `${endpoint.memories}?search=${encodeURIComponent(debouncedSearch.trim())}`;

  const { data: searchData, isLoading } = useSWR(
    debouncedSearch.trim() ? url : null,
    {
      revalidateOnFocus: false,
      onSuccess: () => {
        abortControllerRef.current = null;
      },
    },
  );
  const docs = searchData?.data?.docs;
  const searchResults = useMemo(() => docs ?? [], [docs]);

  const showRecent = !debouncedSearch.trim();
  const showEmpty = debouncedSearch.trim()
    ? !isLoading && isEmpty(searchResults)
    : isEmpty(recentMemories);

  const handleClearSearch = useCallback(() => {
    setSearch("");
    setDebouncedSearch("");
    setActiveIndex(-1);
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const results = showRecent ? recentMemories : searchResults;
      const maxIndex = results.length - 1;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((prev) => (prev < maxIndex ? prev + 1 : 0));
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((prev) => (prev > 0 ? prev - 1 : maxIndex));
          break;
        case "Enter":
          if (activeIndex >= 0 && results[activeIndex]) {
            const memory = results[activeIndex];
            navigate(`/memories/${memory?._id}`);
            close?.("search-memory");
          }
          break;
        case "Escape":
          if (search) {
            handleClearSearch();
          } else {
            close?.("search-memory");
          }
          break;
      }
    },
    [
      activeIndex,
      showRecent,
      recentMemories,
      searchResults,
      search,
      handleClearSearch,
      close,
      navigate,
    ],
  );

  useEffect(() => {
    if (activeIndex >= 0 && resultsRef.current) {
      const activeElement = resultsRef.current.querySelector(
        `#search-item-${activeIndex}`,
      );
      if (activeElement) {
        activeElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [activeIndex]);

  return (
    <div className="flex size-full max-h-[600px] flex-col bg-white">
      <div className="border-b border-v3-stroke-weak p-6 pb-4">
        <div className="flex w-full items-center gap-2 rounded-lg border border-v3-stroke-weak bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-v3-brand-strong focus-within:ring-offset-0">
          <SearchIcon width={16} height={16} className="shrink-0 text-v3-text-weak" aria-hidden />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={!showEmpty}
            aria-controls="search-results"
            aria-activedescendant={
              activeIndex >= 0 ? `search-item-${activeIndex}` : undefined
            }
            aria-autocomplete="list"
            aria-label="Search memories"
            placeholder="Start searching..."
            className="min-w-0 flex-1 border-0 bg-transparent font-inter text-sm text-v3-text-strong outline-none placeholder:text-v3-text-weaker"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          {Boolean(search) && !isLoading ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={handleClearSearch}
              className="flex shrink-0 items-center justify-center rounded-full p-0.5 text-v3-text-weak hover:text-v3-text-strong"
            >
              <X size={14} strokeWidth={1.5} />
            </button>
          ) : null}
          {isLoading ? (
            <Spinner
              loading
              className="!size-5 shrink-0 !text-v3-text-weak"
            />
          ) : null}
        </div>
      </div>

      <div
        id="search-results"
        ref={resultsRef}
        role="listbox"
        aria-label="Search results"
        className="flex-1 overflow-y-auto px-6 py-4"
      >
        {showEmpty ? (
          <div className="animate-fadeIn flex h-full items-center justify-center">
            <div className="flex flex-col items-center justify-center py-12 text-center">
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
          </div>
        ) : showRecent ? (
          <div className="animate-fadeIn space-y-4">
            <h3 className="font-inter text-sm font-semibold uppercase tracking-wide text-v3-text-weak">
              Recently Opened
            </h3>
            <div className="space-y-1">
              {recentMemories.map((memory, i) => (
                <div
                  key={memory._id}
                  className="animate-slideIn"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <SearchItem
                    memory={memory}
                    searchTerm=""
                    isActive={i === activeIndex}
                    itemId={`search-item-${i}`}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="animate-fadeIn space-y-4">
            <h3
              className="font-inter text-sm font-semibold uppercase tracking-wide text-v3-text-weak"
              role="status"
              aria-live="polite"
            >
              Stories • {searchResults.length}{" "}
              {searchResults.length === 1 ? "result" : "results"}
            </h3>
            {isLoading ? (
              <div className="space-y-2">
                {Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <div
                      key={i}
                      className="animate-slideIn"
                      style={{ animationDelay: `${i * 30}ms` }}
                    >
                      <div className="flex animate-pulse items-center gap-3 rounded-lg px-3 py-3">
                        <div className="size-12 shrink-0 rounded-lg bg-v3-fill-weak" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-[70%] rounded bg-v3-fill-weak" />
                          <div className="h-3 w-[90%] rounded bg-v3-fill-weak" />
                        </div>
                        <div className="h-3 w-16 shrink-0 rounded bg-v3-fill-weak" />
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="space-y-1">
                {searchResults.map((memory, i) => (
                  <div
                    key={memory._id}
                    className="animate-slideIn"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <SearchItem
                      memory={memory}
                      searchTerm={debouncedSearch.trim()}
                      isActive={i === activeIndex}
                      itemId={`search-item-${i}`}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function SearchMemoriesV2() {
  const { close } = useModal();

  return (
    <div className="h-full w-full">
      <div
        className="hidden h-full w-full items-center justify-center sm:flex"
        onClick={() => close?.("search-memory")}
      >
        <div
          className="flex w-fit justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-full max-w-[640px] min-w-[min(100%,640px)] overflow-hidden rounded-2xl border border-v3-stroke-weak bg-white shadow-[0px_8px_40px_var(--brown-100)]">
            <SearchModalContent />
          </div>
        </div>
      </div>
      <Sheet
        detent="content"
        className="block sm:hidden"
        isOpen
        onClose={() => close?.("search-memory")}
        snapPoints={[0, 0.8]}
      >
        <Sheet.Container className="max-h-[80dvh] overflow-hidden bg-white">
          <Sheet.Header className="rounded-3xl bg-white" />
          <Sheet.Content className="max-h-[80dvh] min-h-0 overflow-y-auto overscroll-contain bg-white px-0 pb-6">
            <SearchModalContent />
          </Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop />
      </Sheet>
    </div>
  );
}
