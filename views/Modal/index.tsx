import { useModal } from "@/hooks/use-modal";
import { SharePost } from "./SharePost";
import Welcome from "./Welcome";
import FilePreview from "./FilePreview";
import EditMemory from "./EditMemory";
import { isEmpty } from "@/utility";
import UploadFiles from "./UploadFile";
import SetTagPermissions from "./SetTagPermissions";
import PromptInput from "./PromptInput";

export default function Modal() {
  const { state } = useModal();
  const modal = state[0]

  if (isEmpty(state)) return null;
  return (
    <div className={`modal-overlay z-[100] bg-[rgba(94,94,94,0.5)] ${state ? "flex" : "hidden"}`}>
      {
        modal.name === "share-post" ?
          <SharePost id={modal.props} />
          : modal.name === "welcome" ?
            <Welcome />
            : modal.name === "file-preview" ?
              <FilePreview files={modal.props} /> :
              modal.name === "file-upload" ?
                <UploadFiles id={modal.props} /> :
                modal.name === "edit-memory" ?
                  <EditMemory memory={modal.props} /> :
                  modal.name === "set-tag-permission" ?
                    <SetTagPermissions memory={modal.props} /> :
                    modal.name === "prompt" ?
                      <PromptInput data={modal.props} /> :
                      null
      }
    </div>
  );
}
