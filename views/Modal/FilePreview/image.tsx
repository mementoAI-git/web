import { IFile } from "@/utility/interface";
import ActionBtn from "./action-btns";
import { IFilePreviewItem } from ".";

export default function ImagePreview(props: IFilePreviewItem) {
  return (
    <div className="mx-auto max-w-110">
      <ActionBtn {...props} />
      <img
        src={props.url}
        alt={props.name}
        className="rounded-2xl size-full w-full h-auto border-[3px] border-grey-500"
      />
    </div>
  )
}