import ModalLayout from "@/components/ModalLayout";
import PromptInput from "../PromptInput";
import UploadModal from "./UploadFile";

interface IPromptResponseModal {
  onClose: () => void
  open: boolean
}
export default function PromptResponseModal({ open, onClose }: IPromptResponseModal) {
  return (
    <ModalLayout open={open} onClose={onClose}>
      {/* <PromptInput /> */}
      <UploadModal />
    </ModalLayout>
  )
}