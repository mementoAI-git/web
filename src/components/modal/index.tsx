import { PricingOverlay } from "@/features/pricing/pricing-overlay";
import { InviteFriends } from "./invite-friends";
import { useModal } from "@/hooks/use-modal";
import { SharePost } from "./share-post";
import Welcome from "./welcome";
import FilePreview from "./file-preview";
import { isEmpty } from "@/utility";
import UploadFiles from "./upload-file";
import SetTagPermissions from "./memory/set-tag-permission";
import PromptInput from "./prompt-input";
import {
  BookmarkMemory,
  CreateMemory,
  QuickCapture,
  DeleteMemory,
  UpdateMemory,
  ViewMemory,
  ViewMemoryDetails,
} from "./memory";
import {
  AddBeneficiary,
  DeleteBeneficiary,
  ResendInvite,
  UpdateBeneficiary,
} from "./beneficiary";
import {
  AddGroup,
  UpdateGroup,
  DeleteGroup,
  GroupDetail,
  AddGroupMembers,
} from "./group";
import Setup2FA from "./setup-2fa";
import ChatSettings from "./chat-settings";
import { SearchMemoriesV2 } from "./memory/search/search-modal-v2";
import CreateCapsule from "./capsule/create";
import { DeleteCapsule } from "./capsule/delete";
import { PauseCapsule } from "./capsule/pause";
import { useState, useEffect } from "react";
import { EXIT_ANIMATED_MODALS, ModalClosingContext, modalCloseMs } from "./modal-presence";
// import { DatePickerFilter } from "../Memories/MemoriesFilter";
import ShareMemory from "./memory/share-memory";
import SelectBeneficiary from "./select-beneficiary";
import { Feedback } from "./feedback";
import type { IGroup, IMemory } from "@/utility/interface";
import SettingsAboutMeModal from "./settings-about-me-modal";
import RecentActivitiesModal from "./recent-activities-modal";
import {
  VideoRecorderModal,
} from "./memory/recorder-modal";
import { UnpauseCapsule } from "./capsule";
import { ExitConfirmation } from "./capsule/create/exit-confirmation";
import ConversationFiles, { type ConversationFilesModalData } from "./conversation-files";

const RIGHT_PANEL_MODALS: string[] = [];
const FULL_SCREEN_MODALS = ["create-memory", "view-memory", "file-preview"];

/** Centered horizontally, anchored to the top (tall content / readability). */
const TOP_ALIGNED_MODALS: string[] = [];

/** What voice calls an open modal ("A dialog is open: New story."). Others use their name. */
const VOICE_MODAL_NAMES: Record<string, string> = {
  "create-memory": "New story",
  "quick-capture": "Quick note",
  "create-feedback": "Feedback",
  "recent-activities": "Recent activity",
  "view-memory": "Story",
  "edit-memory": "Edit story",
};

const MODAL_COMPONENTS = {
  "share-post": SharePost,
  welcome: Welcome,
  "file-preview": FilePreview,
  "file-upload": UploadFiles,
  "edit-memory": UpdateMemory,
  "search-memory": SearchMemoriesV2,
  "create-memory": CreateMemory,
  "quick-capture": QuickCapture,
  "delete-memory": DeleteMemory,
  "bookmark-memory": BookmarkMemory,
  "set-tag-permission": SetTagPermissions,
  prompt: PromptInput,
  "add-beneficiary": AddBeneficiary,
  "delete-beneficiary": DeleteBeneficiary,
  "update-beneficiary": UpdateBeneficiary,
  "select-beneficiary": SelectBeneficiary,
  "resend-invite": ResendInvite,
  "add-group": AddGroup,
  "update-group": UpdateGroup,
  "delete-group": DeleteGroup,
  "group-detail": GroupDetail,
  "add-group-members": AddGroupMembers,
  setup2fa: Setup2FA,
  "chat-settings": ChatSettings,
  "create-capsule": CreateCapsule,
  "delete-capsule": DeleteCapsule,
  "pause-capsule": PauseCapsule,
  "unpause-capsule": UnpauseCapsule,
  "edit-capsule": CreateCapsule,
  "view-capsule": (props) => <CreateCapsule {...props} mode="view" />,
  // "date-picker-filter": DatePickerFilter,
  "create-feedback": Feedback,
  "settings-about-me": SettingsAboutMeModal,
  "recent-activities": RecentActivitiesModal,
  "video-recorder": VideoRecorderModal,
  "exit-confirmation": ExitConfirmation,
  "view-memory": ViewMemory,
  "view-memory-details": ViewMemoryDetails,
};

export default function Modal() {
  const { state } = useModal();
  const conversationFiles = state.find((modal) => modal.name === "conversation-files");
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  return <>
    <SearchMemoriesV2 open={state[0]?.name === "search-memory"} isMobile={isMobile} />
    {conversationFiles && <ConversationFiles data={conversationFiles.props as ConversationFilesModalData} />}
    <ModalStack isMobile={isMobile} />
  </>;
}

function isConnectionInvite(modal: { name: string; props?: unknown }) {
  return (
    modal.name === "add-beneficiary" &&
    (modal.props as { mode?: string } | undefined)?.mode !== "beneficiary"
  );
}

type ModalEntry = { name: string; props?: unknown };

function ModalStack({ isMobile }: { isMobile: boolean }) {
  const { state, close } = useModal();

  // A closed story stays mounted for its close animation. Worked out during
  // render (not in an effect) so the same instance keeps rendering, never a remount.
  const [seenState, setSeenState] = useState(state);
  const [leaving, setLeaving] = useState<{ entry: ModalEntry; index: number } | null>(null);
  if (seenState !== state) {
    setSeenState(state);
    const index = isMobile
      ? -1
      : seenState.findIndex(
          (modal) => EXIT_ANIMATED_MODALS.includes(modal.name) && !state.some((next) => next.name === modal.name),
        );
    if (index >= 0) setLeaving({ entry: seenState[index], index });
    else if (leaving && state.some((next) => next.name === leaving.entry.name)) setLeaving(null);
  }
  useEffect(() => {
    if (!leaving) return;
    const timer = window.setTimeout(() => setLeaving(null), modalCloseMs() + 50);
    return () => window.clearTimeout(timer);
  }, [leaving]);
  const stack: ModalEntry[] = leaving
    ? [...state.slice(0, leaving.index), leaving.entry, ...state.slice(leaving.index)]
    : state;

  // ESC key dismissal: always closes the topmost modal
  useEffect(() => {
    const modal = state?.[0];
    if (
      !modal ||
      ["search-memory", "create-feedback", "invite-friends", "pricing", "setup2fa", "conversation-files", "add-group", "update-group", "add-group-members", "share-memory"].includes(modal.name) ||
      isConnectionInvite(modal)
    )
      return;
    const modalName = modal.name;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // Closing Share re-registers this listener mid-press, so the same press must not close the story too.
      if (e.defaultPrevented && modalName === "view-memory") return;
      close(modalName);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state, close]);

  if (isEmpty(stack)) {
    return null;
  }

  const topModal = stack[0];
  if (topModal.name === "conversation-files") return null;
  if (topModal.name === "search-memory") return null;
  // Feedback owns its shadcn portal, backdrop, focus trap, and dismissal.
  if (topModal.name === "create-feedback") {
    return <Feedback data={topModal.props || {}} />;
  }
  if (topModal.name === "pricing")
    return (
      <PricingOverlay
        open
        onOpenChange={(next) => {
          if (!next) close("pricing");
        }}
      />
    );
  if (topModal.name === "invite-friends") return <InviteFriends />;
  // Form dialogs own their portal, backdrop, focus trap, and dismissal.
  if (isConnectionInvite(topModal)) return <AddBeneficiary data={{ mode: "connection" }} />;
  if (topModal.name === "add-group") return <AddGroup />;
  if (topModal.name === "update-group") return <UpdateGroup data={topModal.props as IGroup} />;
  if (topModal.name === "add-group-members") return <AddGroupMembers data={topModal.props as string} />;
  // This dialog owns its portal, backdrop, focus trap, and dismissal.
  if (topModal.name === "setup2fa") return <Setup2FA data={topModal.props as { qrcode: string; secret: string }} />;
  // Share opens from inside a story, so it floats beside the stack and the story stays mounted beneath it.
  const shareOnTop = topModal.name === "share-memory";
  const layers = shareOnTop ? stack.slice(1) : stack;
  const isTopFullscreenModal =
    FULL_SCREEN_MODALS.includes(topModal.name) && !isMobile;

  return (
    <>
    {!isEmpty(layers) && <div
      className={`modal-overlay relative z-100 h-full w-full flex-col justify-center items-center ${
        isTopFullscreenModal || shareOnTop ? "bg-transparent" : "bg-overlay-backdrop"
      } ${state ? "flex" : "hidden"}`}
      onClick={isTopFullscreenModal ? undefined : () => close(topModal.name)}
    >
      {[...layers].reverse().map((modal, i) => {
        const ModalComponent = MODAL_COMPONENTS[modal.name];
        if (!ModalComponent) return null;

        const isRightPanel =
          RIGHT_PANEL_MODALS.includes(modal.name) && !isMobile;
        const isFullscreen =
          FULL_SCREEN_MODALS.includes(modal.name) && !isMobile;
        const isTopAligned =
          TOP_ALIGNED_MODALS.includes(modal.name) &&
          !isMobile &&
          !isRightPanel &&
          !isFullscreen;
        const isTop = modal.name === topModal.name;
        const isLeaving = leaving?.entry === modal;
        const stackIndex = stack.length - 1 - i;
        const hasModalsBehind = i > 0;
        const needsOverlay = !isRightPanel && !isFullscreen && hasModalsBehind;

        return (
          <div
            key={`${modal.name}-${i}`}
            className={`absolute ${isFullscreen ? "inset-0" : "inset-1.5"} ${isLeaving ? "pointer-events-none" : ""} flex ${
              isRightPanel
                ? "flex-row justify-start items-start"
                : isFullscreen
                  ? "flex-row justify-start items-start"
                  : isTopAligned
                    ? "flex-row justify-center items-start pt-6 sm:pt-8 lg:pt-10"
                    : "flex-row justify-center items-center"
            }`}
            style={{ zIndex: isTop ? 10 : stackIndex + 1 }}
            // Voice screen control reaches only the open modal, not the page behind it.
            data-voice-dialog={isTop && !isLeaving ? VOICE_MODAL_NAMES[modal.name] ?? modal.name.replace(/-/g, " ") : undefined}
            onClick={
              !isRightPanel && !isFullscreen
                ? (e) => {
                    e.stopPropagation();
                    if (e.target === e.currentTarget) close(modal.name);
                  }
                : undefined
            }
          >
            {needsOverlay && (
              <div className="absolute -inset-1.5 bg-overlay-backdrop backdrop-blur-sm pointer-events-none" />
            )}
            {isTop &&
              !isMobile &&
              topModal.name !== "create-memory" &&
              topModal.name !== "view-memory" &&
              topModal.name !== "quick-capture" &&
              topModal.name !== "share-post" &&
              topModal.name !== "file-preview" &&
              topModal.name !== "conversation-files" && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    close(modal.name);
                  }}
                  className="absolute top-0 left-0 z-10 flex items-center gap-2 rounded-full bg-background py-2.5 pr-3 pl-4 font-inter text-sm font-semibold text-text-neutral-strong shadow-md transition-colors hover:bg-fill-neutral-weaker"
                >
                  Cancel
                  <span className="inline-flex items-center rounded bg-fill-neutral-weak px-1.5 py-0.5 font-mono text-[10px] leading-none text-text-neutral-weak">
                    ESC
                  </span>
                </button>
              )}
            <ModalClosingContext.Provider value={isLeaving}>
              <ModalComponent data={modal.props || {}} isMobile={isMobile} />
            </ModalClosingContext.Provider>
          </div>
        );
      })}
    </div>}
    {shareOnTop && <ShareMemory data={topModal.props as { memory: IMemory }} />}
    </>
  );
}
