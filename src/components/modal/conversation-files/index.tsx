import FocusTrap from "focus-trap-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FileText, Film, Image as ImageIcon, Link2, Music2, Search, X } from "lucide-react";
import endpoint from "@/api/endpoint";
import { fetcher } from "@/api/fetcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
      className="group relative aspect-square min-w-0 overflow-hidden bg-fill-neutral-weaker focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-brand-strong"
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
  const classes = "flex min-h-16 w-full min-w-0 items-center gap-3 rounded-xl border border-stroke-neutral-weaker bg-background p-3 text-left transition-colors hover:bg-fill-neutral-weaker focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-brand-strong";
  return audio ? (
    <button type="button" onClick={onOpen} className={classes} aria-label={`Open ${asset.file.name} in viewer`}>{content}</button>
  ) : (
    <a href={src} download={asset.file.name} className={classes} aria-label={`Download ${asset.file.name}`}>{content}</a>
  );
}

export default function ConversationFiles({ data }: { data: ConversationFilesModalData }) {
  const { close, push } = useModal();
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

  return (
    <FocusTrap focusTrapOptions={{ initialFocus: () => searchRef.current ?? undefined, escapeDeactivates: false, clickOutsideDeactivates: false }}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="conversation-files-title"
        className="flex h-[min(925px,calc(100vh-24px))] w-[min(760px,calc(100vw-24px))] min-h-0 flex-col overflow-hidden rounded-2xl bg-background text-text-neutral-strong shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="shrink-0 space-y-4 p-5 pb-3 sm:p-6 sm:pb-4">
          <div className="flex items-center gap-4">
            <h2 id="conversation-files-title" className="min-w-0 flex-1 font-geist text-2xl font-bold">All files ({index.total})</h2>
            <Button type="button" variant="ghost" size="icon-lg" onClick={() => close?.("conversation-files")} aria-label="Close all files" className="rounded-full bg-fill-neutral-weaker">
              <X className="size-5" aria-hidden />
            </Button>
          </div>
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-icon-neutral-weaker" aria-hidden />
            <span className="sr-only">Search conversation files</span>
            <Input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search files and links" className="h-10 rounded-lg bg-fill-neutral-weaker pl-9" />
          </label>
        </header>

        <Tabs value={tab} onValueChange={(value) => setTab(value as ConversationAssetTab)} className="min-h-0 flex-1 gap-0">
          <TabsList className="mx-5 grid h-auto w-auto shrink-0 grid-cols-3 gap-2 rounded-none bg-transparent p-0 sm:mx-6">
            <TabsTrigger value="media" className="h-12 rounded-lg bg-fill-neutral-weaker data-active:bg-fill-neutral-strong data-active:text-text-inverse-strong"><ImageIcon aria-hidden />Media ({index.media.length})</TabsTrigger>
            <TabsTrigger value="docs" className="h-12 rounded-lg bg-fill-neutral-weaker data-active:bg-fill-neutral-strong data-active:text-text-inverse-strong"><FileText aria-hidden />Docs ({index.docs.length})</TabsTrigger>
            <TabsTrigger value="links" className="h-12 rounded-lg bg-fill-neutral-weaker data-active:bg-fill-neutral-strong data-active:text-text-inverse-strong"><Link2 aria-hidden />Links ({index.links.length})</TabsTrigger>
          </TabsList>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-4 sm:px-6">
            {loadingOlder ? <div className="mb-3 flex items-center justify-center gap-2 text-sm text-text-neutral-weak"><Spinner loading className="!m-0 !size-4" />Loading older files…</div> : null}
            {loadError ? (
              <div role="status" className="mb-3 flex items-center justify-between gap-3 rounded-lg bg-fill-neutral-weaker p-3 text-sm text-text-neutral-weak">
                <span>Some older files couldn&apos;t be loaded.</span>
                <Button type="button" variant="outline" size="sm" onClick={() => setLoadVersion((value) => value + 1)}>Retry</Button>
              </div>
            ) : null}
            {noResults && !loadingOlder ? (
              <p className="py-16 text-center font-geist text-sm text-text-neutral-weak">{query.trim() ? `No results for “${query.trim()}”` : `No ${tab} shared in this conversation yet.`}</p>
            ) : null}

            <TabsContent value="media" className="space-y-4">
              {visualMedia.length ? <div className="grid grid-cols-2 gap-1 min-[480px]:grid-cols-3 md:grid-cols-4">
                {visualMedia.map((asset) => <MediaCell key={asset.key} asset={asset} onOpen={() => openAssets(visualMedia, asset)} />)}
              </div> : null}
              {audioMedia.length ? <div className="grid gap-2 sm:grid-cols-2">
                {audioMedia.map((asset) => <FileRow key={asset.key} asset={asset} onOpen={() => openAssets(audioMedia, asset)} />)}
              </div> : null}
            </TabsContent>
            <TabsContent value="docs" className="grid gap-2 sm:grid-cols-2">
              {filtered.docs.map((asset) => <FileRow key={asset.key} asset={asset} />)}
            </TabsContent>
            <TabsContent value="links" className="grid gap-2 sm:grid-cols-2">
              {filtered.links.map((link) => <ChatLinkPreview key={link.key} link={link} />)}
            </TabsContent>
          </div>
        </Tabs>
      </section>
    </FocusTrap>
  );
}
