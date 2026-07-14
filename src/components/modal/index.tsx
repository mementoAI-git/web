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
// import { DatePickerFilter } from "../Memories/MemoriesFilter";
import ShareMemory from "./memory/share-memory";
import SelectBeneficiary from "./select-beneficiary";
import { Feedback } from "./feedback";
import MemoryInsights from "./memory-insights";
import SettingsAboutMeModal from "./settings-about-me-modal";
import RecentActivitiesModal from "./recent-activities-modal";
import {
  AudioRecorderModal,
  VideoRecorderModal,
} from "./memory/recorder-modal";
import { UnpauseCapsule } from "./capsule";
import { ExitConfirmation } from "./capsule/create/exit-confirmation";

const RIGHT_PANEL_MODALS = ["view-memory"];
const FULL_SCREEN_MODALS = ["create-memory"];

/** Centered horizontally, anchored to the top (tall content / readability). */
const TOP_ALIGNED_MODALS = ["memory-insights"];

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
  "share-memory": ShareMemory,
  "create-feedback": Feedback,
  "memory-insights": MemoryInsights,
  "settings-about-me": SettingsAboutMeModal,
  "recent-activities": RecentActivitiesModal,
  "audio-recorder": AudioRecorderModal,
  "video-recorder": VideoRecorderModal,
  "exit-confirmation": ExitConfirmation,
  "view-memory": ViewMemory,
  "view-memory-details": ViewMemoryDetails,
};

export default function Modal() {
  const { state, close } = useModal();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // ESC key dismissal: always closes the topmost modal
  useEffect(() => {
    const modal = state?.[0];
    if (!modal) return;
    const modalName = modal.name;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(modalName);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state, close]);

  if (isEmpty(state)) {
    return null;
  }

  const topModal = state[0];
  const isTopFullscreenModal =
    FULL_SCREEN_MODALS.includes(topModal.name) && !isMobile;

  return (
    <div
      className={`modal-overlay relative z-100 h-full w-full flex-col justify-center items-center ${
        isTopFullscreenModal ? "bg-transparent" : "bg-overlay-backdrop"
      } ${state ? "flex" : "hidden"}`}
      onClick={isTopFullscreenModal ? undefined : () => close(topModal.name)}
    >
      {[...state].reverse().map((modal, i) => {
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
        const stackIndex = state.length - 1 - i;
        const hasModalsBehind = i > 0;
        const needsOverlay = !isRightPanel && !isFullscreen && hasModalsBehind;

        return (
          <div
            key={`${modal.name}-${i}`}
            className={`absolute ${isFullscreen ? "inset-0" : "inset-1.5"} flex ${isRightPanel
                ? "flex-row justify-start items-start"
                : isFullscreen
                  ? "flex-row justify-start items-start"
                : isTopAligned
                  ? "flex-row justify-center items-start pt-6 sm:pt-8 lg:pt-10"
                  : "flex-row justify-center items-center"
              }`}
            style={{ zIndex: isTop ? 10 : stackIndex + 1 }}
            onClick={!isRightPanel && !isFullscreen ? (e) => {
              e.stopPropagation();
              if (e.target === e.currentTarget) close(modal.name);
            } : undefined}
          >
            {needsOverlay && (
              <div className="absolute -inset-1.5 bg-overlay-backdrop backdrop-blur-sm pointer-events-none" />
            )}
            {isTop &&
              !isMobile &&
              topModal.name !== "create-memory" &&
              topModal.name !== "quick-capture" &&
              topModal.name !== "share-post" && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  close(modal.name);
                }}
                className="absolute top-0 left-0 z-10 flex items-center gap-2 bg-white rounded-full pl-4 pr-3 py-2.5 shadow-md font-inter font-semibold text-sm text-gray-800 hover:bg-gray-50 transition-colors"
              >
                Cancel
                <span className="inline-flex items-center bg-gray-100 text-gray-500 text-[10px] px-1.5 py-0.5 rounded font-mono leading-none">
                  ESC
                </span>
              </button>
            )}
            <ModalComponent data={modal.props || {}} isMobile={isMobile} />
          </div>
        );
      })}
    </div>
  );
}
