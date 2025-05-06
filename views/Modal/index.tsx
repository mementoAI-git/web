import { useModal } from "@/hooks/use-modal";
import { SharePost } from "./SharePost";
import Welcome from "./Welcome";
import FilePreview from "./FilePreview";
import EditMemory from "./EditMemory";
import { isEmpty } from "@/utility";
import UploadFiles from "./UploadFile";
import SetTagPermissions from "./SetTagPermissions";
import PromptInput from "./PromptInput";
import DeleteMemory from "./DeleteMemory";
import { AddBeneficiary, DeleteBeneficiary } from "./Beneficiary";
import { UpdateBeneficiary } from "./Beneficiary/Update";


const MODAL_COMPONENTS = {
  "share-post": SharePost,
  "welcome": Welcome,
  "file-preview": FilePreview,
  'file-upload': UploadFiles,
  "edit-memory": EditMemory,
  "set-tag-permission": SetTagPermissions,
  "prompt": PromptInput,
  "delete-memory": DeleteMemory,
  "add-beneficiary": AddBeneficiary,
  "delete-beneficiary": DeleteBeneficiary,
  "update-beneficiary": UpdateBeneficiary
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
