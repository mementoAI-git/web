import ModalLayout from "@/components/ModalLayout";
import PromptInput from "../PromptInput";
import TagAndPermissions from "./TagAndPermissions";
import UploadFiles from "../UploadFile";
import { usePrompt } from "@/hooks/use-prompt";
import SharePost from "./SharePost";

export default function PromptResponseModal() {
  const { navigations, back, data, set } = usePrompt()
  return (
    <ModalLayout open={navigations.length > 0 && data} onClose={back}>
      <PromptInput />
      <UploadFiles />
      <TagAndPermissions />
      <SharePost />
    </ModalLayout>
  )
}