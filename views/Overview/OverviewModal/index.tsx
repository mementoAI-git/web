import ModalLayout from "@/components/ModalLayout";
import PromptInput from "../PromptInput";
import TagAndPermissions from "./TagAndPermissions";
import UploadFiles from "../UploadFile";
import { usePrompt } from "@/hooks/use-prompt";

export default function PromptResponseModal() {
  const { navigations, back } = usePrompt()
  return (
    <ModalLayout open={navigations.length > 0} onClose={back}>
      <PromptInput />
      <UploadFiles />
      <TagAndPermissions />
    </ModalLayout>
  )
}