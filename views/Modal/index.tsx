import { useModal } from "@/hooks/use-modal";
import { SharePost } from "./SharePost";
import Welcome from "./Welcome";
import FilePreview from "./FilePreview";
import { isEmpty } from "@/utility";
import UploadFiles from "./UploadFile";
import SetTagPermissions from "./SetTagPermissions";
import PromptInput from "./PromptInput";
import { CreateMemory, DeleteMemory, UpdateMemory } from "./Memory";
import { AddBeneficiary, DeleteBeneficiary } from "./Beneficiary";
import { UpdateBeneficiary } from "./Beneficiary/Update";
import Setup2FA from "./Setup2FA";
import ChatSettings from "./ChatSetting";
import { SearchMemories } from "./Memory/Search";
import CreateCapsule from "./Capsule/Create";
import SelectBeneficiary from "./SelectBeneficiary";
import { DeleteCapsule } from "./Capsule/Delete";
import { PauseCapsule } from "./Capsule/Pause";


const MODAL_COMPONENTS = {
  "share-post": SharePost,
  "welcome": Welcome,
  "file-preview": FilePreview,
  'file-upload': UploadFiles,
  "edit-memory": UpdateMemory,
  "search-memory": SearchMemories,
  "create-memory": CreateMemory,
  "set-tag-permission": SetTagPermissions,
  "prompt": PromptInput,
  "delete-memory": DeleteMemory,
  "add-beneficiary": AddBeneficiary,
  "delete-beneficiary": DeleteBeneficiary,
  "update-beneficiary": UpdateBeneficiary,
  "select-beneficiary": SelectBeneficiary,
  'setup2fa': Setup2FA,
  'chat-settings': ChatSettings,
  "create-capsule": CreateCapsule,
  "delete-capsule": DeleteCapsule,
  "pause-capsule": PauseCapsule,
}

export default function Modal() {
  const { state } = useModal();
  const modal = state[0]

  if (isEmpty(state)) return null;
  const ModalComponent = MODAL_COMPONENTS[modal?.name];

  return (
    <div className={`modal-overlay z-[100] bg-[rgba(94,94,94,0.5)] ${state ? "flex" : "hidden"}`}>
      {ModalComponent && <ModalComponent data={modal.props || {}} />}
    </div>
  );
}
