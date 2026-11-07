import endSessionArtwork from "@/assets/icon/voice-end-session.svg";
import { Button } from "@/components/ui/button";
import { FormDialogContent } from "@/components/modal/form-dialog";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type EndSessionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  duration: string;
  ending: boolean;
  onConfirm: () => void;
};

export function EndSessionDialog({
  open,
  onOpenChange,
  duration,
  ending,
  onConfirm,
}: EndSessionDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => !ending && onOpenChange(nextOpen)}
    >
      <FormDialogContent
        overlayClassName="z-[210] backdrop-blur-none"
        className="z-[220] flex h-[346px] flex-col gap-6 border border-stroke-neutral-weak bg-bg-raised shadow-2xl ring-0"
      >
        <DialogHeader className="flex-1 items-center justify-center gap-6 py-0 text-center">
          <div
            aria-hidden
            className="flex size-20 shrink-0 items-center justify-center"
          >
            <img src={endSessionArtwork} alt="" width={72} height={72} />
          </div>
          <div className="flex flex-col items-center gap-3">
            <DialogTitle className="w-full max-w-full font-geist text-2xl font-bold leading-8 text-text-neutral-strong">
              Are you sure you want to end this session?
            </DialogTitle>
            <DialogDescription className="font-geist text-base leading-6 tabular-nums text-text-neutral-weak">
              {duration}
            </DialogDescription>
          </div>
        </DialogHeader>
        <div className="grid shrink-0 grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={ending}
            className="h-10 rounded-lg px-4 font-geist text-sm font-bold"
            onClick={() => onOpenChange(false)}
          >
            Dismiss
          </Button>
          <Button
            type="button"
            disabled={ending}
            className="h-10 rounded-lg px-4 font-geist text-sm font-bold [background-image:var(--gradient-overview-story)]"
            onClick={onConfirm}
          >
            {ending ? "Ending…" : "End Session"}
          </Button>
        </div>
      </FormDialogContent>
    </Dialog>
  );
}
