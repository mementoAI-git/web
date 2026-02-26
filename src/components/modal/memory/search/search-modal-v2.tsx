import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet } from "react-modal-sheet";
import endpoint from "@/api/endpoint";
import { SearchIcon, TimesIcon } from "@/components/icons";
import Spinner from "@/components/spinner";
import { getRecentMemories, isEmpty } from "@/utility";
import { useModal } from "@/hooks/use-modal";
import { useStore } from "@/hooks/use-store";
import { ModalCloseBtn } from "@/components/modal/modalLayout";
import useSWR from "swr";
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
      }
    }
  );
  const searchResults = searchData?.data?.docs || [];

  const showRecent = !debouncedSearch.trim();
  const showEmpty = debouncedSearch.trim() ? (!isLoading && isEmpty(searchResults)) : isEmpty(recentMemories);

  const handleClearSearch = useCallback(() => {
    setSearch("");
    setDebouncedSearch("");
    setActiveIndex(-1);
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const results = showRecent ? recentMemories : searchResults;
    const maxIndex = results.length - 1;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex(prev => (prev < maxIndex ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex(prev => (prev > 0 ? prev - 1 : maxIndex));
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
  }, [activeIndex, showRecent, recentMemories, searchResults, search, handleClearSearch, close, navigate]);

  useEffect(() => {
    if (activeIndex >= 0 && resultsRef.current) {
      const activeElement = resultsRef.current.querySelector(`#search-item-${activeIndex}`);
      if (activeElement) {
        activeElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [activeIndex]);

  return (
    <div className="size-full bg-white flex flex-col max-h-[600px]">
      {/* Search Input Section - Prominent at Top */}
      <div className="p-6 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3 bg-gray-50 rounded-xl border border-gray-200 px-4 py-3.5 focus-within:border-gray-300 focus-within:bg-white transition-all">
          <SearchIcon className="text-gray-400 shrink-0 w-5 h-5" />
          <input
            ref={inputRef}
            role="combobox"
            aria-expanded={!showEmpty}
            aria-controls="search-results"
            aria-activedescendant={activeIndex >= 0 ? `search-item-${activeIndex}` : undefined}
            aria-autocomplete="list"
            aria-label="Search memories"
            placeholder="Start searching..."
            className="flex-1 outline-0 bg-transparent text-base placeholder:text-gray-400"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          {search && !isLoading && (
            <button
              onClick={handleClearSearch}
              aria-label="Clear search"
              className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <TimesIcon className="size-5" />
            </button>
          )}
          {isLoading && (
            <Spinner loading className="!size-5 !text-gray-400 shrink-0" />
          )}
        </div>
      </div>

      {/* Results Section */}
      <div
        id="search-results"
        ref={resultsRef}
        role="listbox"
        aria-label="Search results"
        className="flex-1 overflow-y-auto px-6 py-4"
      >
        {showEmpty ? (
          <div className="animate-fadeIn flex items-center justify-center h-full">
            {/* Empty State - Inline */}
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="bg-gray-100 rounded-full p-3 mb-3">
                <SearchIcon className="text-gray-400 w-8 h-8" />
              </div>
              <div className="mb-2 font-inter text-base font-semibold text-gray-900">
                {showRecent ? "No recent memories" : "No memories found"}
              </div>
              <div className="font-inter text-sm text-gray-500 max-w-xs">
                {showRecent
                  ? "Your recently opened memories will appear here."
                  : "Try searching for a different keyword."}
              </div>
            </div>
          </div>
        ) : showRecent ? (
          <div className="space-y-4 animate-fadeIn">
            <h3 className="font-inter font-semibold text-sm text-gray-500 uppercase tracking-wide">
              Recently Opened
            </h3>
            <div className="space-y-1">
              {recentMemories.map((memory, i) => (
                <div key={memory._id} className="animate-slideIn" style={{ animationDelay: `${i * 30}ms` }}>
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
          <div className="space-y-4 animate-fadeIn">
            <h3 className="font-inter font-semibold text-sm text-gray-500 uppercase tracking-wide" role="status" aria-live="polite">
              Stories • {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}
            </h3>
            {isLoading ? (
              <div className="space-y-2">
                {Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="animate-slideIn" style={{ animationDelay: `${i * 30}ms` }}>
                      <div className="flex items-center gap-3 py-3 px-3 rounded-lg animate-pulse">
                        <div className="size-12 shrink-0 bg-gray-200 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <div className="bg-gray-200 rounded h-4 w-[70%]" />
                          <div className="bg-gray-200 rounded h-3 w-[90%]" />
                        </div>
                        <div className="bg-gray-200 rounded h-3 w-16 shrink-0" />
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="space-y-1">
                {searchResults.map((memory, i) => (
                  <div key={memory._id} className="animate-slideIn" style={{ animationDelay: `${i * 30}ms` }}>
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
    <div>
      <div className="hidden w-full !min-w-[640px] !max-w-[640px] sm:block modal-container !bg-white !p-0 !rounded-2xl overflow-hidden">
        <ModalCloseBtn onClick={() => close?.("search-memory")} className="!absolute !top-4 !right-4 !z-10" />
        <SearchModalContent />
      </div>
      <Sheet
        detent="content"
        className="block sm:hidden"
        isOpen
        onClose={() => close?.("search-memory")}
        snapPoints={[0.5, 0.75, 1]}
      >
        <Sheet.Container className="bg-white">
          <Sheet.Header className="bg-white rounded-3xl" />
          <Sheet.Content className="bg-white px-0 pb-6">
            <ModalCloseBtn className="!relative ml-auto !right-4 !top-0 mb-2" onClick={() => close?.("search-memory")} />
            <SearchModalContent />
          </Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop />
      </Sheet>
    </div>
  );
}
