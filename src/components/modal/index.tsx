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
  DeleteMemory,
  UpdateMemory,
} from "./memory";
import {
  AddBeneficiary,
  DeleteBeneficiary,
  ResendInvite,
  UpdateBeneficiary,
} from "./beneficiary";
import Setup2FA from "./setup-2fa";
import ChatSettings from "./chat-settings";
import { SearchMemoriesV2 } from "./memory/search/search-modal-v2";
import CreateCapsule from "./capsule/create";
import { DeleteCapsule } from "./capsule/delete";
import { PauseCapsule } from "./capsule/pause";
import { useState, useEffect } from "react";
// import { DatePickerFilter } from "../Memories/MemoriesFilter";
import Settings from "./settings";
import ShareMemory from "./memory/share-memory";
import SelectBeneficiary from "./select-beneficiary";
import { Feedback } from "./feedback";
import MemoryInsights from "./memory-insights";
import { AudioRecorderModal, VideoRecorderModal } from "./memory/recorder-modal";

const RIGHT_PANEL_MODALS = ["create-memory"];

const MODAL_COMPONENTS = {
  "share-post": SharePost,
  welcome: Welcome,
  "file-preview": FilePreview,
  "file-upload": UploadFiles,
  "edit-memory": UpdateMemory,
  "search-memory": SearchMemoriesV2,
  "create-memory": CreateMemory,
  "delete-memory": DeleteMemory,
  "bookmark-memory": BookmarkMemory,
  "set-tag-permission": SetTagPermissions,
  prompt: PromptInput,
  "add-beneficiary": AddBeneficiary,
  "delete-beneficiary": DeleteBeneficiary,
  "update-beneficiary": UpdateBeneficiary,
  "select-beneficiary": SelectBeneficiary,
  "resend-invite": ResendInvite,
  setup2fa: Setup2FA,
  "chat-settings": ChatSettings,
  "create-capsule": CreateCapsule,
  "delete-capsule": DeleteCapsule,
  "pause-capsule": PauseCapsule,
  "edit-capsule": CreateCapsule,
  "view-capsule": (props) => <CreateCapsule {...props} mode="view" />,
  settings: Settings,
  // "date-picker-filter": DatePickerFilter,
  "share-memory": ShareMemory,
  "create-feedback": Feedback,
  "memory-insights": MemoryInsights,
  "audio-recorder": AudioRecorderModal,
  "video-recorder": VideoRecorderModal,
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

  // ESC key dismissal for right-panel modals
  useEffect(() => {
    const modal = state?.[0];
    if (!modal || !RIGHT_PANEL_MODALS.includes(modal.name)) return;
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

  const modal = state[0];
  const ModalComponent = modal ? MODAL_COMPONENTS[modal.name] : null;

  if (!ModalComponent) return null;

  const isRightPanel = RIGHT_PANEL_MODALS.includes(modal.name) && !isMobile;

  return (
    <div
      className={`modal-overlay z-[100] bg-[rgba(94,94,94,0.5)] ${state ? "flex" : "hidden"}`}
      onClick={isRightPanel ? () => close(modal.name) : undefined}
    >
      {isRightPanel ? (
        <>
          {/* Floating Cancel button — 20px from top-left of viewport */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); close(modal.name); }}
            className="absolute top-5 left-5 z-10 flex items-center gap-2 bg-white rounded-full pl-4 pr-3 py-2.5 shadow-md font-inter font-semibold text-sm text-gray-800 hover:bg-gray-50 transition-colors"
          >
            Cancel
            <span className="inline-flex items-center bg-gray-100 text-gray-500 text-[10px] px-1.5 py-0.5 rounded font-mono leading-none">
              ESC
            </span>
          </button>
          <ModalComponent data={modal.props || {}} isMobile={isMobile} />
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center p-4">
          {ModalComponent && (
            <ModalComponent data={modal.props || {}} isMobile={isMobile} />
          )}
        </div>
      )}
    </div>
  );
}
