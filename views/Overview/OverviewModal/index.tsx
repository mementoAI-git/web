import ModalLayout from "@/components/ModalLayout";
import PromptInput from "../PromptInput";
import UploadModal from "./UploadFile";
import TagAndPermissions from "./TagAndPermissions";

interface IPromptResponseModal {
  onClose: () => void
  open: boolean
}
export default function PromptResponseModal({ open, onClose }: IPromptResponseModal) {
  return (
    <ModalLayout open={open} onClose={onClose}>
      <PromptInput />
      {/* <UploadModal /> */}
      {/* <TagAndPermissions /> */}
    </ModalLayout>
  )
}