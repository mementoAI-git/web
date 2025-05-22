import { ModalCloseBtn } from "@/components/ModalLayout";
import { useModal } from "@/hooks/use-modal";
import { PropsWithChildren, useMemo } from "react";
import PromptInputFooter from "./Footer";
import { IMemory } from "@/utility/interface";
import { isEmpty } from "@/utility";

interface IPromptInputLayout extends PropsWithChildren {
  type: string
  memory: IMemory
  editMode?: boolean;
  onDiscard: () => void;
  onSave: () => void;
  saving?: boolean;
  loading?: boolean
}

export default function PromptLayout({ children, ...props }: IPromptInputLayout) {
  const { close } = useModal()

  return (
    <div className="modal-container">
      <ModalCloseBtn onClick={() => close("prompt")} />
      <div className="space-y-6">
        {
          !isEmpty(props?.memory?.title) &&
          <h4 className="modal-title">{props?.memory?.title}</h4>
        }
        {children}
      </div>
      <PromptInputFooter {...props} />
    </div>
  )
}