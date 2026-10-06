import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import success from "@/assets/image/auth/reset-success.png";

export default function PasswordResetSuccess({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[calc(100%-2rem)] gap-5 rounded-[20px] bg-bg-neutral p-5 font-geist text-text-neutral-strong sm:max-w-[365px] [&>button.absolute]:rounded-full [&>button.absolute]:bg-fill-neutral-weak"
        overlayClassName="bg-overlay-backdrop supports-backdrop-filter:backdrop-blur-none"
      >
        <div className="flex flex-col items-center gap-6 py-4 text-center">
          <img src={success} alt="" className="size-[93px] object-contain" />
          <div className="flex max-w-[250px] flex-col gap-2.5">
            <DialogTitle className="text-base font-bold leading-6">
              Password reset successful
            </DialogTitle>
            <DialogDescription className="text-xs leading-[18px] text-text-neutral-weak">
              You can continue using Memento AI by logging in with your new
              password.
            </DialogDescription>
          </div>
        </div>
        <DialogClose asChild>
          <Button className="h-11 w-full rounded-lg text-sm font-bold">
            Done
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
