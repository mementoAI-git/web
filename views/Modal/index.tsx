import { useModal } from "@/hooks/use-modal";
import { SharePost } from "./SharePost";
import Welcome from "./Welcome";
import FilePreview from "./FilePreview";

export default function Modal() {
  const { state } = useModal();
  if (!state) return null;
  return (
    <div
      className={`modal-overlay z-[100] bg-[rgba(94,94,94,0.5)] ${state ? "flex" : "hidden"} `}
    >
      {state.name === "share-post" ? (
        <SharePost data={state.props} />
      ) : state.name === "welcome" ? (
        <Welcome />
      ) : state.name === "file-preview" ? (
        <FilePreview files={state.props} />
      ) : null}
    </div>
  );
}
