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
import { SearchMemories } from "./memory/search";
import CreateCapsule from "./capsule/create";
import { DeleteCapsule } from "./capsule/delete";
import { PauseCapsule } from "./capsule/pause";
import { useState, useEffect } from "react";
// import { DatePickerFilter } from "../Memories/MemoriesFilter";
import Settings from "./settings";
import ShareMemory from "./memory/share-memory";
import SelectBeneficiary from "./select-beneficiary";
import { Feedback } from "./feedback";

const MODAL_COMPONENTS = {
  "share-post": SharePost,
  welcome: Welcome,
  "file-preview": FilePreview,
  "file-upload": UploadFiles,
  "edit-memory": UpdateMemory,
  "search-memory": SearchMemories,
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
  // "create-capsule": CreateCapsule,
  "create-capsule": CreateCapsule,
  "delete-capsule": DeleteCapsule,
  "pause-capsule": PauseCapsule,
  settings: Settings,
  // "date-picker-filter": DatePickerFilter,
  "share-memory": ShareMemory,
  "create-feedback": Feedback,
};

export default function Modal() {
  const { state } = useModal();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (isEmpty(state)) {
    return null;
  }

  const modal = state[0];
  const ModalComponent = modal ? MODAL_COMPONENTS[modal.name] : null;

  if (!ModalComponent) return null;

  return (
    <div
      className={`modal-overlay z-[100] bg-[rgba(94,94,94,0.5)] ${state ? "flex" : "hidden"}`}
    >
      <div className="w-full h-full flex items-center justify-center p-4">
        {ModalComponent && (
          <ModalComponent data={modal.props || {}} isMobile={isMobile} />
        )}
      </div>
    </div>
  );
}
