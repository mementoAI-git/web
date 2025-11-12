import { useFloating, offset, flip, shift, autoUpdate } from "@floating-ui/react";
import ActionBtn from "./action-btns";
import type { FilePreviewItem } from "./index";

export default function ImagePreview(props: FilePreviewItem) {
  const { refs, floatingStyles } = useFloating({
    placement: "top-end",
    middleware: [offset(16), flip(), shift()],
    whileElementsMounted: autoUpdate,
  });

  return (
    <div className="relative mx-auto w-full max-w-full sm:max-w-96 md:max-w-80 lg:max-w-[440px]">
      <div ref={refs.setReference} className="relative">
        <img src={props.url} alt={props.name} className="size-full rounded-2xl border-[3px] border-grey-500 object-cover" />
      </div>
      <div ref={refs.setFloating} style={floatingStyles} className="absolute z-10">
        <ActionBtn {...props} />
      </div>
    </div>
  );
}

