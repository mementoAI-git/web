import { useState } from "react";
import { CameraIcon, ClipIcon, ImageIcon, MicIcon, PlanePaperIcon, PlusIcon } from "@/components/icons";
import useClickAway from "@/hooks/use-clickaway";

const icons = [CameraIcon, ImageIcon, MicIcon, ClipIcon, PlanePaperIcon];

interface AddFileButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export default function AddFileButton({ onClick, disabled = false }: AddFileButtonProps) {
  const [show, setShow] = useState(false);
  const ref = useClickAway(() => setShow(false));

  return (
    <div ref={ref} className="relative">
      {show && (
        <div className="shadow-btn absolute -top-15 flex gap-1 rounded-xl bg-white p-2 text-text-neutral-weak">
          {icons.map((Icon, index) => (
            <button
              key={index}
              type="button"
              onClick={onClick}
              className="flex size-8 cursor-pointer items-center justify-center p-2"
            >
              <Icon width={16} height={16} />
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setShow((prev) => !prev)}
        className="flex aspect-square w-12 cursor-pointer items-center justify-center rounded-[10px] bg-sand-2 text-sand-8"
      >
        <PlusIcon strokeWidth={3} width={16} height={16} />
      </button>
    </div>
  );
}
