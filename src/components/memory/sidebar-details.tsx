"use client";

import PropsItem from "@/components/props-item";
import type { IMemory } from "@/utility/interface";
import { getPostTypeLabel, type PostTypeSource } from "@/utility/memory";

import {
  FolderIcon,
  Calendar1Icon,
  LockIcon,
  ClipIcon,
  TagIcon,
  TimesIcon,
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
}: Pick<ContentProps, "memory" | "isMobile" | "source" | "quickActions"> & {
  open: ReturnType<typeof useModal>["open"];
  runAndMaybeCloseMobile: (fn: () => void) => void;
}) {
  return (
    <>
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
  onClose,
  isMobile = false,
  source,
  quickActions,
  enableChatPreferencesTab = false,
  activeTab = "memory",
  onTabChange,
}: ContentProps) {
  const { open } = useModal();

  const runAndMaybeCloseMobile = (fn: () => void) => {
    fn();
    if (isMobile) onClose();
  };

  const showChat = enableChatPreferencesTab && activeTab === "chat";

  return (
    <div
      className={cn(
        "flex h-full w-full min-w-0 flex-col gap-0 p-3 sm:p-4 lg:p-6",
        showChat ? "min-w-[min(100%,320px)]" : "min-w-[min(100%,287px)]",
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        {enableChatPreferencesTab && onTabChange ? (
          <div
            className="flex min-w-0 flex-1 rounded-full border border-v3-stroke-weak bg-v3-fill-weaker/50 p-0.5"
            role="tablist"
            aria-label="Panel sections"
          >
            <Button
              type="button"
              role="tab"
              aria-selected={activeTab === "memory"}
              variant={activeTab === "memory" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 min-w-0 flex-1 rounded-full px-2 text-xs font-medium sm:text-sm"
              onClick={() => onTabChange("memory")}
            >
              Memory
            </Button>
            <Button
              type="button"
              role="tab"
              aria-selected={activeTab === "chat"}
              variant={activeTab === "chat" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 min-w-0 flex-1 rounded-full px-2 text-xs font-medium sm:text-sm"
              onClick={() => onTabChange("chat")}
            >
              Chat
            </Button>
          </div>
        ) : (
          <div className="min-w-0 flex-1" />
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0 rounded-full text-v3-icon-neutral hover:bg-v3-fill-weaker"
          onClick={onClose}
          aria-label="Close panel"
        >
          <TimesIcon width={10} height={10} aria-hidden />
        </Button>
      </div>

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
  desktopLayout = "overlay",
}: SidebarDetailsProps) {
  const desktopWidth =
    isOpen && enableChatPreferencesTab && activeTab === "chat" ? 336 : 287;
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
              source={source}
              quickActions={quickActions}
              enableChatPreferencesTab={enableChatPreferencesTab}
              activeTab={activeTab}
              onTabChange={onTabChange}
            />
          </Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop />
      </Sheet>

      <motion.div
        initial={false}
        animate={{
          width: isOpen ? desktopWidth : 0,
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
          "hidden overflow-hidden border-l border-v3-stroke-weak bg-white md:flex md:flex-col",
          isInlineDesktop ?
            "relative z-auto h-full min-h-0 min-w-0 shrink-0 self-stretch" :
            "fixed top-0 right-0 z-40 h-screen",
        )}
      >
        <div className="h-full min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
          <Content
            memory={memory}
            onClose={onClose}
            isMobile={false}
            source={source}
            quickActions={quickActions}
            enableChatPreferencesTab={enableChatPreferencesTab}
            activeTab={activeTab}
            onTabChange={onTabChange}
          />
        </div>
      </motion.div>
      {isOpen && !isInlineDesktop ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-30 hidden bg-black/20 md:block"
          onClick={onClose}
          aria-hidden
        />
      ) : null}
    </>
  );
}
