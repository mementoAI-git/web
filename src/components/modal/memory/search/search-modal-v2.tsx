import { useReducedMotion } from "motion/react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import "./search-motion.css";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Sheet } from "react-modal-sheet";
import endpoint from "@/api/endpoint";
import { fetchMemorySearch } from "@/api/memory-search";
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

  const url = `${endpoint.memorySearch}?q=${encodeURIComponent(debouncedSearch.trim())}`;

  const {
    data: searchData,
    isLoading,
    isValidating,
    error,
    mutate,
  } = useSWR(
    debouncedSearch.trim() && user ? [url, user._id || user.email] : null,
    ([requestUrl]: [string, string]) => fetchMemorySearch(requestUrl),
    {
      revalidateOnFocus: false,
      keepPreviousData: false,
      shouldRetryOnError: false,
      refreshInterval: (data) => (data?.data?.search?.preparing ? 3000 : 0),
    },
  );
  const docs = searchData?.data?.docs;
  const searchResults = useMemo(() => docs ?? [], [docs]);

  const showRecent = !search.trim();
  const queryChanging = search.trim() !== debouncedSearch.trim();
  const searchError = !showRecent && !queryChanging && error;
  const isSearching =
    !showRecent && (queryChanging || isLoading || isValidating);
  const showEmpty =
    !isSearching &&
    !searchError &&
    (showRecent ? isEmpty(recentMemories) : isEmpty(searchResults));

  const handleClearSearch = useCallback(() => {
    setSearch("");
    setDebouncedSearch("");
    inputRef.current?.focus();
  }, []);

  const visibleMemories = showRecent
    ? recentMemories
    : queryChanging || isLoading || searchError
      ? []
      : searchResults;

  return (
    <Command
      label="Search memories"
      shouldFilter={false}
      defaultValue="__memory-search-no-selection__"
      className="flex size-full flex-col rounded-none bg-bg-neutral-solid p-0"
    >
      <div
        data-slot="memory-search-header"
        className="relative border-b border-v3-stroke-weak px-3 py-4 [&_[data-slot=command-input-wrapper]]:p-0"
      >
        <CommandInput
          ref={inputRef}
          aria-label="Search memories"
          placeholder="Describe a memory, or search its words…"
          maxLength={200}
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
            className="memory-search-spinner absolute right-7 top-1/2 !size-5 -translate-y-1/2 !text-v3-text-weak"
          />
        ) : null}
      </div>

      {!showRecent ? (
        <div
          role="status"
          aria-live="polite"
          className="px-6 pt-3 font-inter text-xs text-v3-text-weak"
        >
          {isSearching
            ? "Searching your memories…"
            : searchError
              ? null
              : searchData?.data?.search?.preparing
                ? "Some memories are still being prepared. Word searches still work."
                : searchData?.data?.search?.limited
                  ? "Some memories can only be searched by their words right now."
                  : searchData?.data?.search?.mode === "keyword"
                    ? "Searching words in your memories."
                    : "Searches your saved memories, stories and chats."}
        </div>
      ) : null}
      {searchError ? (
        <div
          role="alert"
          className="px-6 py-6 font-inter text-sm text-v3-text-weak"
        >
          <p>Search is unavailable right now. Please try again.</p>
          <button
            type="button"
            disabled={isSearching}
            onClick={() => void mutate()}
            className="mt-3 rounded-md px-3 py-2 text-v3-text-strong hover:bg-v3-fill-weak focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v3-brand-strong"
          >
            Try again
          </button>
        </div>
      ) : null}

      <CommandList
        aria-label="Search results"
        aria-busy={isSearching}
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
                {showRecent
                  ? "No recent memories"
                  : searchData?.data?.search?.mode === "keyword"
                    ? "No word matches"
                    : "No memories found"}
              </div>
              <div className="max-w-xs font-inter text-sm text-v3-text-weak">
                {showRecent
                  ? "Your recently opened memories will appear here."
                  : "Try a different description, name, or word."}
              </div>
            </div>
          </CommandEmpty>
        ) : null}

        {!showEmpty && !searchError && visibleMemories.length > 0 ? (
          <CommandGroup
            heading={
              showRecent
                ? "Recently opened"
                : `Memories · ${searchResults.length} ${searchResults.length === 1 ? "result" : "results"}`
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
  open?: boolean;
}

export function SearchMemoriesV2({
  isMobile = false,
  open = true,
}: SearchMemoriesV2Props) {
  const { close } = useModal();
  const reducedMotion = useReducedMotion();
  const openerRef = useRef<HTMLElement | null>(null);
  const morphTriggerRef = useRef<HTMLElement | null>(null);
  const setPanelRef = useCallback(
    (panel: HTMLDivElement | null) => {
      if (!panel) {
        morphTriggerRef.current?.removeAttribute("data-search-morphing");
        morphTriggerRef.current = null;
        return;
      }
      if (reducedMotion) return;
      const focusedTrigger = document.activeElement?.closest<HTMLElement>(
        "[data-search-trigger]",
      );
      const trigger =
        focusedTrigger ??
        Array.from(
          document.querySelectorAll<HTMLElement>("[data-search-trigger]"),
        ).find((element) => element.getBoundingClientRect().width > 0);
      if (!trigger) return;
      const origin = trigger.getBoundingClientRect();
      if (!origin.width || !origin.height) return;
      const width = panel.offsetWidth || Math.min(640, window.innerWidth - 48);
      const height =
        panel.offsetHeight || Math.min(520, window.innerHeight - 48);
      panel.style.setProperty(
        "--search-morph-x",
        `${origin.left - (window.innerWidth - width) / 2}px`,
      );
      panel.style.setProperty(
        "--search-morph-y",
        `${origin.top - (window.innerHeight - height) / 2}px`,
      );
      panel.style.setProperty(
        "--search-morph-scale-x",
        String(origin.width / width),
      );
      panel.style.setProperty(
        "--search-morph-scale-y",
        String(origin.height / height),
      );
      panel.dataset.morph = "true";
      trigger.dataset.searchMorphing = "true";
      morphTriggerRef.current = trigger;
      openerRef.current = focusedTrigger ?? openerRef.current;
    },
    [reducedMotion],
  );

  useEffect(() => {
    if (open) return;
    const rememberFocus = (event: FocusEvent) => {
      if (
        event.target instanceof HTMLElement &&
        event.target !== document.body &&
        !event.target.closest(".memory-search-dialog")
      ) {
        openerRef.current = event.target;
      }
    };
    document.addEventListener("focusin", rememberFocus);
    return () => document.removeEventListener("focusin", rememberFocus);
  }, [open]);

  if (!isMobile) {
    return (
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) close?.("search-memory");
        }}
      >
        <DialogContent
          ref={setPanelRef}
          data-slot="memory-search-panel"
          showCloseButton
          onCloseAutoFocus={(event) => {
            if (openerRef.current?.isConnected) {
              event.preventDefault();
              openerRef.current.focus();
            }
          }}
          overlayClassName="memory-search-overlay z-100 bg-overlay-backdrop"
          className="memory-search-dialog z-[101] flex h-[min(520px,calc(100dvh-3rem))] w-[min(640px,calc(100vw-3rem))] max-w-none flex-col gap-0 overflow-hidden rounded-2xl border border-v3-stroke-weak bg-bg-neutral-solid p-0 shadow-[0px_8px_40px_var(--brown-100)] sm:max-w-none"
        >
          <DialogTitle className="sr-only">Search memories</DialogTitle>
          <DialogDescription className="sr-only">
            Search your saved memories, stories and chats, or choose a recent
            memory.
          </DialogDescription>
          <SearchModalContent />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet
      detent="content"
      className="block"
      isOpen={open}
      prefersReducedMotion={Boolean(reducedMotion)}
      tweenConfig={{ duration: open ? 0.25 : 0.15, ease: [0.22, 1, 0.36, 1] }}
      onClose={() => close?.("search-memory")}
      snapPoints={[0, 0.8]}
    >
      <Sheet.Container className="h-[80dvh] max-h-[80dvh] overflow-hidden bg-bg-neutral-solid">
        <Sheet.Header className="rounded-3xl bg-bg-neutral-solid" />
        <Sheet.Content className="h-full min-h-0 overflow-hidden overscroll-contain bg-bg-neutral-solid px-0 pb-6">
          <SearchModalContent />
        </Sheet.Content>
      </Sheet.Container>
      <Sheet.Backdrop />
    </Sheet>
  );
}
