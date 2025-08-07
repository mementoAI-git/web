import { IFile } from "@/utility/interface";
import ActionBtn from "./action-btns";
import { IFilePreviewItem } from ".";
import { useFloating, offset, flip, shift, autoUpdate } from '@floating-ui/react';
import { useRef } from 'react';

export default function ImagePreview(props: IFilePreviewItem) {
  const { refs, floatingStyles } = useFloating({
    placement: 'top-end',
    middleware: [offset(16), flip(), shift()],
    whileElementsMounted: autoUpdate,
  });

  return (
    <div className="relative mx-auto w-full max-w-full sm:max-w-96 md:max-w-80 lg:max-w-110">
      <div ref={refs.setReference} className="relative">
        <img
          src={props.url}
          alt={props.name}
          className="rounded-2xl size-full w-full h-auto border-[3px] border-grey-500"
        />
      </div>
      <div
        ref={refs.setFloating}
        style={floatingStyles}
        className="absolute z-10"
      >
        <ActionBtn {...props} />
      </div>
    </div>
  )
}