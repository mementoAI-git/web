"use client";

import { useCallback, useEffect, useState } from "react";

import PropsItem from "@/components/props-item";
import type { IMemory } from "@/utility/interface";
import { getPostTypeLabel, type PostTypeSource } from "@/utility/memory";

import {
  FolderIcon,
  Calendar1Icon,
  LockIcon,
  ClipIcon,
  TagIcon,
  EditIcon,
  TrashIcon,
} from "@/components/icons";

import dayjs from "dayjs";
import { useModal } from "@/hooks/use-modal";
import { Sheet } from "react-modal-sheet";
import { Download, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import * as motion from "motion/react-client";
import { ChatPreferencesPanel } from "@/components/modal/chat-settings/chat-preferences-panel";
import { HostChatEnrichmentBar } from "@/features/host-chat/components/host-chat-enrichment-bar";

/** Minimum width kept for the main chat column before shrinking the docked sidebar. */
const SIDEBAR_DESKTOP_MAIN_RESERVE_PX = 420;
const SIDEBAR_CHAT_MAX_PX = 400;
const SIDEBAR_CHAT_MIN_PX = 280;
const SIDEBAR_MEMORY_MAX_PX = 316;
const SIDEBAR_MEMORY_MIN_PX = 260;

/**
 * Pixel width for the desktop memory sidebar (`md+`), based on viewport so the
 * conversation column is not squeezed off-screen on smaller laptop widths.
 */
export function resolveSidebarDesktopWidthPx(
  viewportWidth: number,
  opts: { wideChatPanel: boolean },
): number {
  if (!Number.isFinite(viewportWidth)) {
    return opts.wideChatPanel ? SIDEBAR_CHAT_MAX_PX : SIDEBAR_MEMORY_MAX_PX;
  }
  const budget = viewportWidth - SIDEBAR_DESKTOP_MAIN_RESERVE_PX;
  if (opts.wideChatPanel) {
    return Math.min(
      SIDEBAR_CHAT_MAX_PX,
      Math.max(SIDEBAR_CHAT_MIN_PX, budget),
    );
  }
  return Math.min(
    SIDEBAR_MEMORY_MAX_PX,
    Math.max(SIDEBAR_MEMORY_MIN_PX, budget),
  );
}

function useAnimatedSidebarWidthPx(
  isOpen: boolean,
  wideChatPanel: boolean,
): number {
  const compute = useCallback(() => {
    if (typeof window === "undefined") {
      return isOpen ?
          resolveSidebarDesktopWidthPx(1440, { wideChatPanel }) :
          0;
    }
    if (!isOpen) return 0;
    return resolveSidebarDesktopWidthPx(window.innerWidth, {
      wideChatPanel,
    });
  }, [isOpen, wideChatPanel]);

  const [widthPx, setWidthPx] = useState(() => compute());

  useEffect(() => {
    setWidthPx(compute());
    if (typeof window === "undefined") return;
    const onResize = () => setWidthPx(compute());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [compute]);

  return widthPx;
}

export type MemorySidebarQuickActions = {
  onViewFullDetails: () => void;
  onEditMemory: () => void;
  onExportConversation?: () => void;
  onDelete: () => void;
};

export type SidebarPanelTab = "memory" | "chat";

interface SidebarDetailsProps {
  memory: IMemory;
  onClose: () => void;
  isOpen: boolean;
  source?: PostTypeSource;
  /** Conversation chat: memory menu actions (previously in header dropdown). */
  quickActions?: MemorySidebarQuickActions | null;
  /** When true, show Memory | Chat tabs (chat = sound, voice, upgrade). */
  enableChatPreferencesTab?: boolean;
  activeTab?: SidebarPanelTab;
  onTabChange?: (tab: SidebarPanelTab) => void;
  /** Enrichment stats to show in the Memory tab (moved from conversation toolbar). */
  enrichmentScore?: number;
  deltaToday?: number;
  /**
   * Desktop only. `overlay` = fixed right panel + dimmed backdrop (stories, etc.).
   * `inline` = third column in page flex row, no backdrop (chat conversation).
   */
  desktopLayout?: "overlay" | "inline";
}

interface ContentProps {
  memory: IMemory;
  onClose: () => void;
  isMobile?: boolean;
  source?: PostTypeSource;
  quickActions?: MemorySidebarQuickActions | null;
  enableChatPreferencesTab?: boolean;
  activeTab?: SidebarPanelTab;
  onTabChange?: (tab: SidebarPanelTab) => void;
  /** Enrichment stats to show in the Memory tab. */
  enrichmentScore?: number;
  deltaToday?: number;
  desktopLayout?: "overlay" | "inline";
}

const sectionBadgeClass =
  "mb-2 w-fit border-v3-stroke-weak bg-v3-fill-weaker/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-v3-text-weaker";

const actionButtonClass =
  "h-auto w-full justify-start gap-2.5 rounded-lg px-2.5 py-2.5 font-inter text-sm font-medium text-v3-text-strong hover:bg-v3-fill-weaker";

function MemorySections({
  memory,
  isMobile: _isMobile,
  source,
  quickActions,
  open,
  runAndMaybeCloseMobile,
  enrichmentScore,
  deltaToday,
}: Pick<ContentProps, "memory" | "isMobile" | "source" | "quickActions" | "enrichmentScore" | "deltaToday"> & {
  open: ReturnType<typeof useModal>["open"];
  runAndMaybeCloseMobile: (fn: () => void) => void;
}) {
  return (
    <>
      {enrichmentScore !== undefined && (
        <div className="mb-4">
          <HostChatEnrichmentBar
            enrichmentScore={enrichmentScore}
            deltaToday={deltaToday ?? 0}
            className="w-full !justify-start"
          />
        </div>
      )}
      {quickActions ? (
        <>
          <div className="space-y-1">
            <Badge variant="outline" className={sectionBadgeClass}>
              Memory
            </Badge>
            <ul className="flex flex-col gap-0.5">
              <li>
                <Button
                  type="button"
                  variant="ghost"
                  className={actionButtonClass}
                  onClick={() => runAndMaybeCloseMobile(quickActions.onViewFullDetails)}
                >
                  <Info className="size-4 shrink-0 text-v3-icon-neutral" strokeWidth={1.75} aria-hidden />
                  View full details
                </Button>
              </li>
              <li>
                <Button
                  type="button"
                  variant="ghost"
                  className={actionButtonClass}
                  onClick={() => runAndMaybeCloseMobile(quickActions.onEditMemory)}
                >
                  <EditIcon width={16} height={16} aria-hidden />
                  Edit memory
                </Button>
              </li>
              {quickActions.onExportConversation ? (
                <li>
                  <Button
                    type="button"
                    variant="ghost"
                    className={actionButtonClass}
                    onClick={() =>
                      runAndMaybeCloseMobile(quickActions.onExportConversation!)
                    }
                  >
                    <Download
                      className="size-4 shrink-0 text-v3-icon-neutral"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    Export conversation
                  </Button>
                </li>
              ) : null}
              <li>
                <Button
                  type="button"
                  variant="ghost"
                  className={cn(
                    actionButtonClass,
                    "text-destructive hover:bg-destructive/10 hover:text-destructive",
                  )}
                  onClick={() => runAndMaybeCloseMobile(quickActions.onDelete)}
                >
                  <TrashIcon width={16} height={16} aria-hidden />
                  Delete
                </Button>
              </li>
            </ul>
          </div>
          <Separator className="my-4 bg-v3-stroke-weak" />
        </>
      ) : null}

      <div className="space-y-2">
        <Badge variant="outline" className={sectionBadgeClass}>
          Properties
        </Badge>
        <ul>
          <PropsItem
            icon={<FolderIcon width={16} />}
            title="post type:"
            subtitle={getPostTypeLabel(memory, source)}
          />
          <PropsItem
            icon={<Calendar1Icon width={13} />}
            title="created:"
            subtitle={dayjs(memory.created_at).format("MMM DD, YYYY")}
          />
          <PropsItem
            icon={<Calendar1Icon width={13} />}
            title="last updated:"
            subtitle={dayjs(memory.updated_at).format("MMM DD, YYYY")}
          />
          <PropsItem
            icon={<LockIcon width={13} />}
            title="permission level:"
            subtitle={`lvl ${memory.level}`}
          />
        </ul>
      </div>

      <Separator className="my-4 bg-v3-stroke-weak" />

      <div className="space-y-2">
        <Badge variant="outline" className={sectionBadgeClass}>
          Stats
        </Badge>
        <ul>
          <PropsItem
            icon={<ClipIcon width={13} />}
            title="attachment:"
            subtitle={<span className="mem-tags">{memory?.attachments?.length || 0}</span>}
          />
          <PropsItem
            icon={<TagIcon width={16} />}
            title="tags:"
            className="!items-start"
            subtitle={
              <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                {memory.tags.map((t) => (
                  <span key={t} className="mem-tags text-xs sm:text-sm">
                    {t}
                  </span>
                ))}
                <button
                  type="button"
                  onClick={() => open("set-tag-permission", { memory, isNew: false })}
                  className="mem-tags !border !border-v3-text-strong !bg-transparent text-left text-xs sm:text-sm"
                >
                  + Add tag
                </button>
              </div>
            }
          />
        </ul>
      </div>
    </>
  );
}

function Content({
  memory,
  onClose: _onClose,
  isMobile = false,
  source,
  quickActions,
  enableChatPreferencesTab = false,
  activeTab = "memory",
  onTabChange: _onTabChange,
  enrichmentScore,
  deltaToday,
  desktopLayout = "overlay",
}: ContentProps) {
  const { open } = useModal();

  const runAndMaybeCloseMobile = (fn: () => void) => {
    fn();
    if (isMobile) _onClose();
  };

  const showChat = enableChatPreferencesTab && activeTab === "chat";
  const isDesktopOverlayCard = !isMobile && desktopLayout === "overlay";

  return (
    <div
      className={cn(
        "flex h-full w-full min-w-0 max-w-full flex-col gap-0 bg-v3-bg",
        showChat ? "p-2.5 sm:p-3 md:p-3 lg:p-6" : "p-3 sm:p-4 lg:p-6",
        showChat ? "w-full min-w-0" : "min-w-[min(100%,287px)]",
        showChat && "min-h-0 flex-1 overflow-hidden",
        isDesktopOverlayCard &&
          cn(
            "rounded-[24px] border border-v3-stroke-weak shadow-[0_8px_32px_rgba(15,23,42,0.08)]",
            !showChat && "min-h-0 overflow-y-auto overflow-x-hidden",
          ),
      )}
    >

      {showChat ? (
        <ChatPreferencesPanel density="compact" className="min-h-0 flex-1 pb-4" />
      ) : (
        <MemorySections
          memory={memory}
          isMobile={isMobile}
          source={source}
          quickActions={quickActions}
          open={open}
          runAndMaybeCloseMobile={runAndMaybeCloseMobile}
          enrichmentScore={enrichmentScore}
          deltaToday={deltaToday}
        />
      )}
    </div>
  );
}

export default function SidebarDetails({
  memory,
  onClose,
  isOpen,
  source,
  quickActions,
  enableChatPreferencesTab = false,
  activeTab = "memory",
  onTabChange,
  enrichmentScore,
  deltaToday,
  desktopLayout = "overlay",
}: SidebarDetailsProps) {
  const wideChatPanel =
    Boolean(isOpen && enableChatPreferencesTab && activeTab === "chat");
  const desktopWidthPx = useAnimatedSidebarWidthPx(isOpen, wideChatPanel);
  const isInlineDesktop = desktopLayout === "inline";

  return (
    <>
      <Sheet
        detent="content"
        isOpen={isOpen}
        className="block md:hidden"
        onClose={onClose}
        snapPoints={[0.5, 0.75, 1]}
      >
        <Sheet.Container className="bg-sand-1">
          <Sheet.Header className="rounded-3xl bg-sand-1" />
          <Sheet.Content className="bg-sand-1">
            <Content
              memory={memory}
              onClose={onClose}
              isMobile
              desktopLayout={desktopLayout}
              source={source}
              quickActions={quickActions}
              enableChatPreferencesTab={enableChatPreferencesTab}
              activeTab={activeTab}
              onTabChange={onTabChange}
              enrichmentScore={enrichmentScore}
              deltaToday={deltaToday}
            />
          </Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop />
      </Sheet>

      <motion.div
        initial={false}
        animate={{
          width: isOpen ? desktopWidthPx : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
          mass: 0.8,
        }}
        data-testid="memory-sidebar-desktop"
        className={cn(
          // Desktop overlay: docked to the right; inline: flow in page flex row
          "hidden min-w-0 overflow-x-hidden md:flex md:flex-col justify-start items-stretch",
          isInlineDesktop
            ? "relative z-auto h-full min-h-0 min-w-0 shrink-0 self-stretch"
            : "fixed top-[6px] right-[6px] bottom-[6px] z-50 min-h-0 min-w-0",
        )}
      >
        <div className="box-border h-full min-h-0 min-w-0 w-full max-w-full bg-transparent p-0">
          <Content
            memory={memory}
            onClose={onClose}
            isMobile={false}
            desktopLayout={desktopLayout}
            source={source}
            quickActions={quickActions}
            enableChatPreferencesTab={enableChatPreferencesTab}
            activeTab={activeTab}
            onTabChange={onTabChange}
            enrichmentScore={enrichmentScore}
            deltaToday={deltaToday}
          />
        </div>
      </motion.div>
      {isOpen && !isInlineDesktop ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[45] bg-black/40 backdrop-blur-[2px]"
          onClick={onClose}
          aria-hidden
        />
      ) : null}
    </>
  );
}
