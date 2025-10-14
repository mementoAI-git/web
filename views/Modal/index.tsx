import { useModal } from "@/hooks/use-modal";
import { SharePost } from "./SharePost";
import Welcome from "./Welcome";
import FilePreview from "./FilePreview";
import { isEmpty } from "@/utility";
import UploadFiles from "./UploadFile";
import SetTagPermissions from "./Memory/SetTagPermissions";
import PromptInput from "./PromptInput";
import { BookmarkMemory, CreateMemory, DeleteMemory, UpdateMemory } from "./Memory";
import { AddBeneficiary, DeleteBeneficiary, ResendInvite } from "./Beneficiary";
import { UpdateBeneficiary } from "./Beneficiary/Update";
import Setup2FA from "./Setup2FA";
import ChatSettings from "../../components/ChatSetting";
import { SearchMemories } from "./Memory/Search";
import CreateCapsule from "./Capsule/Create";
import SelectBeneficiary from "./SelectBeneficiary";
import { DeleteCapsule } from "./Capsule/Delete";
import { PauseCapsule } from "./Capsule/Pause";
import { useState, useEffect } from "react";
import { DatePickerFilter } from "../Memories/MemoriesFilter";
import Settings from "./Settings";

const MODAL_COMPONENTS = {
  "share-post": SharePost,
  "welcome": Welcome,
  "file-preview": FilePreview,
  'file-upload': UploadFiles,
  "edit-memory": UpdateMemory,
  "search-memory": SearchMemories,
  "create-memory": CreateMemory,
  "bookmark-memory": BookmarkMemory,
  "set-tag-permission": SetTagPermissions,
  "prompt": PromptInput,
  "delete-memory": DeleteMemory,
  "add-beneficiary": AddBeneficiary,
  "delete-beneficiary": DeleteBeneficiary,
  "update-beneficiary": UpdateBeneficiary,
  "select-beneficiary": SelectBeneficiary,
  "resend-invite": ResendInvite,
  'setup2fa': Setup2FA,
  'chat-settings': ChatSettings,
  "create-capsule": CreateCapsule,
  "delete-capsule": DeleteCapsule,
  "pause-capsule": PauseCapsule,
  "settings": Settings,
  "date-picker-filter": DatePickerFilter
}

export default function Modal() {
  const { state } = useModal();
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (isEmpty(state)) {
    return null;
  }

  const modal = state[0];
  const ModalComponent = modal ? MODAL_COMPONENTS[modal.name] : null;

  if (!ModalComponent) return null;

  return (
    <div className={`modal-overlay z-[100] bg-[rgba(94,94,94,0.5)] ${state ? "flex" : "hidden"}`}>
      <div className="w-full h-full flex items-center justify-center p-4">
        {ModalComponent && <ModalComponent data={modal.props || {}} isMobile={isMobile} />}
      </div>
    </div>
  );
}
