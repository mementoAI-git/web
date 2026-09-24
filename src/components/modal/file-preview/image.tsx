import type { FilePreviewItemBase } from "./index";
import { useSignedMediaAccess } from "@/features/media/signed-media-access";

export default function ImagePreview(props: FilePreviewItemBase) {
  const { src, onError } = useSignedMediaAccess(props);
  return <img src={src} onError={onError} alt={props.name || "Previewed image"} className="max-h-full max-w-full rounded-xl object-contain shadow-2xl" />;
}
