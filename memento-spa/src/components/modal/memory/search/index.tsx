import { useEffect, useState } from "react";
import { Sheet } from "react-modal-sheet";
import endpoint from "@/api/endpoint";
import { SearchIcon } from "@/components/icons";
import Spinner from "@/components/spinner";
import { getRecentMemories, isEmpty } from "@/utility";
import { useModal } from "@/hooks/use-modal";
import { useStore } from "@/hooks/use-store";
import { ModalCloseBtn } from "@/components/modal/modalLayout";
import useSWR from "swr";
import SearchItem from "./search-item";
import EmptyRecentMemories from "./empty-recent-memories";
import { SkeletonLoader } from "./loader";

function Content() {
  const { user } = useStore();
  const [recentMemories, setRecentMemories] = useState([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const recent = getRecentMemories(user?.email);
    setRecentMemories(recent);
  }, [user?.email]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 100);

    return () => clearTimeout(timer);
  }, [search]);

  const url = `${endpoint.memories}?search=${encodeURIComponent(debouncedSearch.trim())}`;

  const { data: searchData, isLoading } = useSWR(debouncedSearch.trim() ? url : null);
  const searchResults = searchData?.data?.docs || [];

  const showRecent = !debouncedSearch.trim();
  const showEmpty = debouncedSearch.trim() ? (!isLoading && isEmpty(searchResults)) : isEmpty(recentMemories);

  return (
    <div className="size-full bg-sand-1 space-y-6">
      <div className="space-y-4">
        <h4 className="text-2xl sm:text-[32px] sm:leading-[38px] font-garamond text-gray-800">Search Memento</h4>
        <span className="text-gray-600 text-sm sm:text-base font-inter block">Find anything on Memento</span>
      </div>
      <div>
        <div className="flex h-full flex-1 items-center gap-2 bg-white rounded-lg border border-gray-200 px-[14px] py-2">
          <SearchIcon />
          <input
            placeholder="Search"
            className="flex-1 outline-0"
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
          {
            isLoading &&
            <Spinner loading className="!size-6 !text-black shrink-0" />
          }
        </div>
      </div>
      <div className="transition-all sm:max-h-80 md:max-h-96 hide-scrollbar overflow-y-auto duration-300 ease-in-out">
        {showEmpty ? (
          <div className="animate-fadeIn">
            <EmptyRecentMemories />
          </div>
        ) : showRecent ? (
          <div className="space-y-3 animate-fadeIn">
            <span className="font-inter inline-block font-medium text-sm text-gray-800">Recently opened stories:</span>
            <div className="space-y-2">
              {recentMemories.map((memory, i) => (
                <div key={i} className="animate-slideIn" style={{ animationDelay: `${i * 50}ms` }}>
                  <SearchItem memory={memory} searchTerm="" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <span className="font-inter inline-block font-medium text-sm text-gray-800">
              {searchResults.length} results found:
            </span>
            {isLoading ? (
              <>
                {Array(2)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="animate-slideIn w-full" style={{ animationDelay: `${i * 50}ms` }}>
                      <SkeletonLoader />
                    </div>
                  ))}
              </>
            ) : (
              <div className="space-y-2">
                {searchResults.map((memory, i) => (
                  <div key={i} className="animate-slideIn" style={{ animationDelay: `${i * 50}ms` }}>
                    <SearchItem memory={memory} searchTerm={debouncedSearch.trim()} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export function SearchMemories() {
  const { close } = useModal();

  return (
    <div>
      <div className="hidden w-full !min-w-[618px] sm:block modal-container">
        <ModalCloseBtn onClick={() => close?.("search-memory")} />
        <Content />
      </div>
      <Sheet
        detent="content"
        className="block sm:hidden"
        isOpen
        onClose={() => close?.("search-memory")}
        snapPoints={[0.5, 0.75, 1]}
      >
        <Sheet.Container className="bg-sand-1">
          <Sheet.Header className="bg-sand-1 rounded-3xl" />
          <Sheet.Content className="bg-sand-1 px-4 pb-6">
            <ModalCloseBtn className="!relative ml-auto !right-0 !top-0 mb-2" onClick={() => close?.("search-memory")} />
            <Content />
          </Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop />
      </Sheet>
    </div>
  )
}