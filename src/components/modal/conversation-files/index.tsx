import "./conversation-files.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FileText, Film, Image as ImageIcon, Link2, Music2, Search, X, FolderOpen, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FormDialogContent, FormDialogInput } from "@/components/modal/form-dialog";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useSignedMediaAccess } from "@/features/media/signed-media-access";
import { useModal } from "@/hooks/use-modal";
import type { IMessage } from "@/utility/interface";
import { ChatLinkPreview } from "@/pages/dashboard/chat/conversation/chat-link-preview";
import {
  buildConversationAssetIndex,
  filterConversationAssets,
  type ConversationAssetTab,
  type ConversationFileAsset,
  type ConversationMediaFilter,
  type ConversationPreviewFile,
} from "@/pages/dashboard/chat/conversation/conversation-assets";
import { loadAllConversationMessages, mergeMessages } from "./conversation-history";

export type ConversationFilesModalData = {
  /** Missing for a chat that has no saved history yet; only `messages` are shown. */
  conversationId?: string;
  messages: Partial<IMessage>[];
  initialTab?: ConversationAssetTab;
  initialMediaFilter?: Exclude<ConversationMediaFilter, "all">;
};

const FILE_FILTERS = [
  { value: "images", label: "Images" },
  { value: "videos", label: "Videos" },
  { value: "audio", label: "Audio" },
  { value: "docs", label: "Docs" },
  { value: "links", label: "Links" },
] as const;
type FileFilter = (typeof FILE_FILTERS)[number]["value"];

/** A shortcut's filter, or null to open on the first one with files in it. */
function initialFilter({ initialTab, initialMediaFilter }: ConversationFilesModalData): FileFilter | null {
  if (initialTab === "docs" || initialTab === "links") return initialTab;
  return initialMediaFilter ?? null;
}

function formatSize(size: string | number) {
  const bytes = Number(size);
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function MediaCell({ asset, onOpen }: { asset: ConversationFileAsset; onOpen: () => void }) {
  const { src, onError } = useSignedMediaAccess(asset.file);
  const isVideo = asset.kind === "video";
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => setUnavailable(false), [src]);
  // The name shows straight away, and a refreshed link gets another try. A file that
  // keeps failing is one the browser can't show, as Chrome can't with iPhone HEIC photos.
  const handleError = () => {
    setUnavailable(true);
    void Promise.resolve(onError()).catch(() => undefined);
  };
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open ${asset.file.name || "file"} in viewer`}
      className="group relative aspect-square min-w-0 cursor-pointer overflow-hidden rounded-lg bg-fill-neutral-weaker transition-shadow hover:ring-2 hover:ring-stroke-neutral-strong active:opacity-80 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-brand-strong"
    >
      {unavailable ? (
        <span className="flex size-full flex-col items-center justify-center gap-1 p-1.5 text-center">
          {isVideo ? <Film className="size-5 text-icon-neutral-weak" aria-hidden /> : <ImageIcon className="size-5 text-icon-neutral-weak" aria-hidden />}
          <span className="line-clamp-2 max-w-full break-all font-inter text-[11px] leading-tight text-text-neutral-weak">{asset.file.name || "File"}</span>
        </span>
      ) : isVideo ? (
        <video src={src} onError={handleError} muted preload="metadata" className="size-full object-cover" />
      ) : (
        <img src={src} onError={handleError} alt={asset.file.name} className="size-full object-cover transition-opacity group-hover:opacity-90" />
      )}
      {isVideo && !unavailable ? (
        <span className="absolute inset-0 flex items-center justify-center bg-overlay-backdrop/30">
          <Film className="size-5 text-white" aria-hidden />
        </span>
      ) : null}
    </button>
  );
}

function FileRow({ asset, onOpen }: { asset: ConversationFileAsset; onOpen?: () => void }) {
  const { src } = useSignedMediaAccess(asset.file);
  const audio = asset.kind === "audio";
  const Icon = audio ? Music2 : FileText;
  const content = (
    <>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-fill-neutral-weaker text-icon-neutral-strong">
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-geist text-sm font-semibold text-text-neutral-strong">{asset.file.name || "File"}</span>
        <span className="block truncate font-inter text-xs text-text-neutral-weak">
          {[asset.file.type, formatSize(asset.file.size)].filter(Boolean).join(" · ") || (audio ? "Audio" : "Document")}
        </span>
      </span>
    </>
  );
  const classes = "flex min-h-16 w-full cursor-pointer min-w-0 items-center gap-3 rounded-xl border border-stroke-neutral-weaker bg-bg-neutral-solid p-3 text-left transition-colors hover:bg-fill-neutral-weaker focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-brand-strong";
  return audio ? (
    <button type="button" onClick={onOpen} className={classes} aria-label={`Open ${asset.file.name} in viewer`}>{content}</button>
  ) : (
    <a href={src} download={asset.file.name} className={classes} aria-label={`Download ${asset.file.name}`}>{content}</a>
  );
}

export default function ConversationFiles({ data }: { data: ConversationFilesModalData }) {
  const { close, push, state } = useModal();
  const active = !state?.length || state[0]?.name === "conversation-files";
  const [messages, setMessages] = useState<Partial<IMessage>[]>(data.messages ?? []);
  const [chosenFilter, setFilter] = useState<FileFilter | null>(() => initialFilter(data));
  const [query, setQuery] = useState("");
  const [loadingOlder, setLoadingOlder] = useState(Boolean(data.conversationId));
  const [loadError, setLoadError] = useState(false);
  const [loadVersion, setLoadVersion] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    return () => {
      const target = returnFocusRef.current;
      if (target?.isConnected) requestAnimationFrame(() => target.focus());
    };
  }, []);

  useEffect(() => {
    setMessages(data.messages ?? []);
    setFilter(initialFilter(data));
    setQuery("");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the fields initialFilter reads are listed
  }, [data.conversationId, data.initialMediaFilter, data.initialTab, data.messages]);

  useEffect(() => {
    if (!data.conversationId) {
      setLoadingOlder(false);
      return;
    }
    let cancelled = false;
    setLoadingOlder(true);
    setLoadError(false);
    void loadAllConversationMessages(data.conversationId)
      .then((older) => {
        if (!cancelled) setMessages((current) => mergeMessages(current, older));
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setLoadingOlder(false);
      });
    return () => { cancelled = true; };
  }, [data.conversationId, loadVersion]);

  const index = useMemo(() => buildConversationAssetIndex(messages), [messages]);
  const filtered = useMemo(() => filterConversationAssets(index, query), [index, query]);
  // Follows the search, so a match under another filter can still be found.
  const counts: Record<FileFilter, number> = {
    images: filtered.media.filter((asset) => asset.kind === "image").length,
    videos: filtered.media.filter((asset) => asset.kind === "video").length,
    audio: filtered.media.filter((asset) => asset.kind === "audio").length,
    docs: filtered.docs.length,
    links: filtered.links.length,
  };
  const firstWithFiles = FILE_FILTERS.find(({ value }) => counts[value] > 0)?.value;
  const filter = chosenFilter ?? firstWithFiles ?? "images";
  const visualMedia = filter === "images" || filter === "videos"
    ? filtered.media.filter((asset) => asset.kind === (filter === "images" ? "image" : "video"))
    : [];
  const audioMedia = filter === "audio" ? filtered.media.filter((asset) => asset.kind === "audio") : [];
  const docs = filter === "docs" ? filtered.docs : [];
  const links = filter === "links" ? filtered.links : [];

  const openAssets = useCallback((assets: ConversationFileAsset[], selected: ConversationFileAsset) => {
    const files: ConversationPreviewFile[] = assets.map((asset) => ({ ...asset.file, sharedAt: asset.sharedAt }));
    const startIndex = assets.findIndex((asset) => asset.key === selected.key);
    push?.("file-preview", { files, startIndex: Math.max(0, startIndex) });
  }, [push]);

  const noResults = visualMedia.length + audioMedia.length + docs.length + links.length === 0;
  const emptyLabel = !chosenFilter && !firstWithFiles ? "files" : filter === "docs" ? "documents" : filter;
  const EmptyIcon = query.trim() ? Search : filter === "docs" ? FileText : filter === "links" ? Link2 : FolderOpen;
  const initialLoading = loadingOlder && index.total === 0;

  return (
    <Dialog open={active} onOpenChange={(open) => { if (!open) close?.("conversation-files"); }}>
      <FormDialogContent
        title="Shared files"
        description="Media, documents, and links from this conversation."
        onClose={() => close?.("conversation-files")}
        className="conversation-files-dialog flex max-h-[min(520px,calc(100dvh-2rem))] flex-col gap-0 sm:min-h-[min(480px,calc(100dvh-2rem))]"
        headerClassName="mb-3"
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <div className="relative mb-6 shrink-0">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-icon-neutral-weak" aria-hidden />
          <FormDialogInput ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search conversation files" placeholder="Search files and links" className="pl-10 pr-11" />
          {query ? <Button type="button" variant="ghost" size="icon-xs" aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full" onClick={() => { setQuery(""); searchRef.current?.focus(); }}><X aria-hidden /></Button> : null}
        </div>

        <ToggleGroup
          type="single"
          size="sm"
          variant="outline"
          spacing={1}
          aria-label="Filter files"
          className="mb-3 shrink-0 flex-wrap"
          value={filter}
          onValueChange={(value) => { if (value) setFilter(value as FileFilter); }}
        >
          {FILE_FILTERS.map(({ value, label }) => <ToggleGroupItem key={value} value={value} className="cursor-pointer !px-2 text-[13px] text-text-neutral-weak data-[state=on]:border-stroke-neutral-strong data-[state=on]:bg-fill-neutral-weak data-[state=on]:text-text-neutral-strong">{label} ({counts[value]})</ToggleGroupItem>)}
        </ToggleGroup>

        <div className="scrollbar-hide -m-1 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain p-1" aria-busy={loadingOlder}>
          {initialLoading ? <div role="status" aria-label="Loading shared files" className="grid grid-cols-4 gap-2">
            <span className="sr-only">Loading shared files…</span>
            {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="aspect-square motion-reduce:animate-none" />)}
          </div> : loadingOlder ? <span role="status" className="sr-only">Loading older files…</span> : null}

          {loadError ? <Empty className="p-6" role="status">
            <EmptyHeader>
              <EmptyMedia variant="icon"><AlertCircle aria-hidden /></EmptyMedia>
              <EmptyTitle>Couldn’t load all files</EmptyTitle>
              <EmptyDescription>Some older files couldn’t be loaded. Please try again.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent><Button variant="outline" size="sm" onClick={() => setLoadVersion((value) => value + 1)}>Retry</Button></EmptyContent>
          </Empty> : null}

          {noResults && !loadingOlder && !loadError ? <Empty className="min-h-48 p-6" role="status">
            <EmptyHeader>
              <EmptyMedia variant="icon"><EmptyIcon aria-hidden /></EmptyMedia>
              <EmptyTitle>{query.trim() ? "No matching files" : `No ${emptyLabel} yet`}</EmptyTitle>
              <EmptyDescription>{query.trim() ? `No results for “${query.trim()}”. Try another name or clear your search.` : `The ${emptyLabel} you share in this conversation will appear here.`}</EmptyDescription>
            </EmptyHeader>
            {query.trim() ? <EmptyContent><Button variant="outline" size="sm" onClick={() => { setQuery(""); searchRef.current?.focus(); }}>Clear search</Button></EmptyContent> : null}
          </Empty> : null}

          {visualMedia.length ? <div className="grid shrink-0 grid-cols-4 gap-2">
            {visualMedia.map((asset) => <MediaCell key={asset.key} asset={asset} onOpen={() => openAssets(visualMedia, asset)} />)}
          </div> : null}
          {audioMedia.length ? <div className="grid shrink-0 gap-2">
            {audioMedia.map((asset) => <FileRow key={asset.key} asset={asset} onOpen={() => openAssets(audioMedia, asset)} />)}
          </div> : null}
          {docs.length ? <div className="grid shrink-0 gap-2">
            {docs.map((asset) => <FileRow key={asset.key} asset={asset} />)}
          </div> : null}
          {links.length ? <div className="grid shrink-0 gap-2">
            {links.map((link) => <ChatLinkPreview key={link.key} link={link} />)}
          </div> : null}
        </div>
      </FormDialogContent>
    </Dialog>
  );
}
