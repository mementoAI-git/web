import endSessionArtwork from "@/assets/icon/voice-end-session.svg";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type EndSessionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  duration: string;
  ending: boolean;
  onConfirm: () => void;
};

export function EndSessionDialog({ open, onOpenChange, duration, ending, onConfirm }: EndSessionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !ending && onOpenChange(nextOpen)}>
      <DialogContent showCloseButton={false} overlayClassName="z-[210] bg-overlay-backdrop backdrop-blur-none" className="z-[220] flex h-[450.4px] max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[456px] flex-col gap-6 overflow-y-auto rounded-[32px] border border-stroke-neutral-weak bg-background p-[23px] ring-0 sm:max-w-[456px] dark:bg-fill-voice-elevated">
        <DialogHeader className="flex-1 items-center gap-8 py-[19.2px] text-center">
          <div aria-hidden className="flex size-[116px] shrink-0 items-center justify-center">
            <img src={endSessionArtwork} alt="" width={90} height={90} />
          </div>
          <div className="flex flex-col items-center gap-3">
            <DialogTitle className="w-[233.281px] max-w-full font-geist text-xl font-bold leading-7 text-text-neutral-strong">
              Are you sure you want to end this session?
            </DialogTitle>
            <DialogDescription className="font-geist text-sm leading-5 tabular-nums text-text-neutral-weak">{duration}</DialogDescription>
          </div>
        </DialogHeader>
        <div className="grid shrink-0 grid-cols-2 gap-3">
          <Button type="button" variant="outline" disabled={ending} className="h-12 rounded-lg font-geist text-base font-bold" onClick={() => onOpenChange(false)}>Dismiss</Button>
          <Button type="button" disabled={ending} className="h-12 rounded-lg font-geist text-base font-bold [background-image:var(--gradient-overview-story)]" onClick={onConfirm}>{ending ? "Ending…" : "End Session"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
