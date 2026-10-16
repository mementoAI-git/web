import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FileText, Film, Image as ImageIcon, Link2, Music2, Search, X, FolderOpen, AlertCircle } from "lucide-react";
import endpoint from "@/api/endpoint";
import { fetcher } from "@/api/fetcher";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupButton } from "@/components/ui/input-group";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSignedMediaAccess } from "@/features/media/signed-media-access";
import { useModal } from "@/hooks/use-modal";
import type { IMessage } from "@/utility/interface";
import { ChatLinkPreview } from "@/pages/dashboard/chat/conversation/chat-link-preview";
import {
  buildConversationAssetIndex,
  filterConversationAssets,
  messageIdentity,
  type ConversationAssetTab,
  type ConversationFileAsset,
  type ConversationMediaFilter,
  type ConversationPreviewFile,
} from "@/pages/dashboard/chat/conversation/conversation-assets";
import Spinner from "@/components/spinner";

export type ConversationFilesModalData = {
  conversationId: string;
  messages: Partial<IMessage>[];
  initialTab?: ConversationAssetTab;
  initialMediaFilter?: Exclude<ConversationMediaFilter, "all">;
};

type HistoryPage = { messages?: Partial<IMessage>[]; next?: string | null };

async function loadAllConversationMessages(conversationId: string) {
  const rows: Partial<IMessage>[] = [];
  let next: string | null = "";
  do {
    const response = await fetcher<HistoryPage>(
      `${endpoint.aiPromptMessage}/${conversationId}?next=${encodeURIComponent(next ?? "")}`,
    );
    rows.push(...(response.data?.messages ?? []));
    next = response.data?.next ?? null;
  } while (next);
  return rows;
}

function mergeMessages(...groups: ReadonlyArray<ReadonlyArray<Partial<IMessage>>>) {
  const byId = new Map<string, Partial<IMessage>>();
  for (const message of groups.flat()) byId.set(messageIdentity(message), message);
  return [...byId.values()];
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
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open ${asset.file.name || "file"} in viewer`}
      className="group relative aspect-square min-w-0 overflow-hidden rounded-lg bg-fill-neutral-weaker transition-shadow hover:ring-2 hover:ring-stroke-neutral-strong active:opacity-80 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-brand-strong"
    >
      {isVideo ? (
        <video src={src} onError={onError} muted preload="metadata" className="size-full object-cover" />
      ) : (
        <img src={src} onError={onError} alt={asset.file.name} className="size-full object-cover transition-opacity group-hover:opacity-90" />
      )}
      {isVideo ? (
        <span className="absolute inset-0 flex items-center justify-center bg-overlay-backdrop/30">
          <Film className="size-7 text-white" aria-hidden />
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
  const classes = "flex min-h-16 w-full min-w-0 items-center gap-3 rounded-xl border border-stroke-neutral-weaker bg-bg-neutral-solid p-3 text-left transition-colors hover:bg-fill-neutral-weaker focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-brand-strong";
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
  const [tab, setTab] = useState<ConversationAssetTab>(data.initialTab ?? "media");
  const [query, setQuery] = useState("");
  const [loadingOlder, setLoadingOlder] = useState(true);
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
    setTab(data.initialTab ?? "media");
    setQuery("");
  }, [data.conversationId, data.initialTab, data.messages]);

  useEffect(() => {
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
  const media = useMemo(() => {
    const filter = data.initialMediaFilter;
    if (!filter) return filtered.media;
    const kind = filter === "images" ? "image" : filter === "videos" ? "video" : "audio";
    return filtered.media.filter((asset) => asset.kind === kind);
  }, [data.initialMediaFilter, filtered.media]);
  const visualMedia = media.filter((asset) => asset.kind === "image" || asset.kind === "video");
  const audioMedia = media.filter((asset) => asset.kind === "audio");

  const openAssets = useCallback((assets: ConversationFileAsset[], selected: ConversationFileAsset) => {
    const files: ConversationPreviewFile[] = assets.map((asset) => ({ ...asset.file, sharedAt: asset.sharedAt }));
    const startIndex = assets.findIndex((asset) => asset.key === selected.key);
    push?.("file-preview", { files, startIndex: Math.max(0, startIndex) });
  }, [push]);

  const noResults = tab === "media" ? media.length === 0 : tab === "docs" ? filtered.docs.length === 0 : filtered.links.length === 0;

  const emptyLabel = tab === "docs" ? "documents" : tab === "links" ? "links" : data.initialMediaFilter ?? "media";
  const EmptyIcon = query.trim() ? Search : tab === "docs" ? FileText : tab === "links" ? Link2 : FolderOpen;
  const initialLoading = loadingOlder && index.total === 0;

  return (
    <Dialog open={active} onOpenChange={(open) => { if (!open) close?.("conversation-files"); }}>
      <DialogContent
        className="flex max-h-[min(600px,calc(100dvh-32px))] flex-col gap-5 overflow-hidden sm:max-w-xl motion-reduce:animate-none"
        onOpenAutoFocus={(event) => { event.preventDefault(); searchRef.current?.focus(); }}
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <DialogHeader className="pr-8">
          <DialogTitle>Shared files</DialogTitle>
          <DialogDescription>Media, documents, and links from this conversation.</DialogDescription>
        </DialogHeader>

        <InputGroup>
          <InputGroupAddon><Search aria-hidden /></InputGroupAddon>
          <InputGroupInput ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search conversation files" placeholder="Search files and links" />
          {query && <InputGroupAddon align="inline-end">
            <InputGroupButton size="icon-xs" aria-label="Clear search" onClick={() => { setQuery(""); searchRef.current?.focus(); }}><X aria-hidden /></InputGroupButton>
          </InputGroupAddon>}
        </InputGroup>

        <Tabs value={tab} onValueChange={(value) => setTab(value as ConversationAssetTab)} className="min-h-0 flex-auto flex-col gap-4">
          <TabsList className="w-full shrink-0" aria-label="File types">
            <TabsTrigger value="media"><ImageIcon aria-hidden />Media ({index.media.length})</TabsTrigger>
            <TabsTrigger value="docs"><FileText aria-hidden />Docs ({index.docs.length})</TabsTrigger>
            <TabsTrigger value="links"><Link2 aria-hidden />Links ({index.links.length})</TabsTrigger>
          </TabsList>

          <div className="min-h-0 overflow-y-auto overscroll-contain p-1" aria-busy={loadingOlder}>
            {initialLoading ? <div role="status" aria-label="Loading shared files" className="grid grid-cols-3 gap-2">
              <span className="sr-only">Loading shared files…</span>
              {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="aspect-square motion-reduce:animate-none" />)}
            </div> : loadingOlder ? <div role="status" className="mb-3 flex items-center gap-2 text-sm text-text-neutral-weak"><Spinner loading className="!m-0 !size-4 motion-reduce:animate-none" />Loading older files…</div> : null}

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
              {query.trim() && <EmptyContent><Button variant="outline" size="sm" onClick={() => { setQuery(""); searchRef.current?.focus(); }}>Clear search</Button></EmptyContent>}
            </Empty> : null}

            <TabsContent value="media" className="flex flex-col gap-3">
              {visualMedia.length ? <div className="grid grid-cols-2 gap-2 min-[480px]:grid-cols-3">
                {visualMedia.map((asset) => <MediaCell key={asset.key} asset={asset} onOpen={() => openAssets(visualMedia, asset)} />)}
              </div> : null}
              {audioMedia.length ? <div className="grid gap-2">
                {audioMedia.map((asset) => <FileRow key={asset.key} asset={asset} onOpen={() => openAssets(audioMedia, asset)} />)}
              </div> : null}
            </TabsContent>
            <TabsContent value="docs" className="grid gap-2">
              {filtered.docs.map((asset) => <FileRow key={asset.key} asset={asset} />)}
            </TabsContent>
            <TabsContent value="links" className="grid gap-2">
              {filtered.links.map((link) => <ChatLinkPreview key={link.key} link={link} />)}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
