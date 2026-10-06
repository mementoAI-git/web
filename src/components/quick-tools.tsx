import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AudioLines,
  LayoutGrid,
  ChartNoAxesCombined,
  Plus,
  SlidersHorizontal,
  UsersRound,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import BackgroundMusic from "@/components/modal/chat-settings/background-music";
import { useIsMobile } from "@/hooks/use-mobile";
import { useModal } from "@/hooks/use-modal";

function ToolsContent({ run }: { run: (action: () => void) => void }) {
  const { open } = useModal();
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-4">
      <BackgroundMusic compact />
      <Separator />
      <section className="flex flex-col gap-2" aria-label="Quick actions">
        <h3 className="text-xs font-medium text-muted-foreground">
          Quick actions
        </h3>
        <Button
          variant="ghost"
          className="justify-start"
          onClick={() => run(() => open("quick-capture"))}
        >
          <Zap aria-hidden />
          Quick capture
        </Button>
        <Button
          variant="ghost"
          className="justify-start"
          onClick={() => run(() => open("create-memory"))}
        >
          <Plus aria-hidden />
          Add story/item
        </Button>
        <Button
          variant="ghost"
          className="justify-start"
          onClick={() => run(() => navigate("/chat?mode=voice"))}
        >
          <AudioLines aria-hidden />
          Voice mode
        </Button>
      </section>
      <Separator />
      <section className="flex flex-col gap-2" aria-label="Quick links">
        <h3 className="text-xs font-medium text-muted-foreground">
          Quick links
        </h3>
        <Button
          variant="ghost"
          className="justify-start"
          onClick={() => run(() => open("memory-insights"))}
        >
          <ChartNoAxesCombined aria-hidden />
          Insights
        </Button>
        <Button
          variant="ghost"
          className="justify-start"
          onClick={() => run(() => navigate("/settings/beneficiary"))}
        >
          <UsersRound aria-hidden />
          People
        </Button>
      </section>
    </div>
  );
}

export function QuickTools({
  className,
  overview = false,
}: { className?: string; overview?: boolean } = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();
  // Complete the overlay dismissal before handing focus to another modal.
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const run = (action: () => void) => {
    setPendingAction(() => action);
    setIsOpen(false);
  };
  const onCloseAutoFocus = (event: Event) => {
    if (!pendingAction) return;
    event.preventDefault();
    pendingAction();
    setPendingAction(null);
  };
  const trigger = (
    <Button
      className={className}
      type="button"
      variant="ghost"
      size="icon-lg"
      aria-label="Quick tools"
      title="Quick tools"
    >
      {overview ? (
        <LayoutGrid aria-hidden />
      ) : (
        <SlidersHorizontal aria-hidden />
      )}
    </Button>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent
          side="bottom"
          className="max-h-[85dvh] overflow-y-auto rounded-t-3xl pb-[max(1.5rem,env(safe-area-inset-bottom))]"
          onCloseAutoFocus={onCloseAutoFocus}
        >
          <SheetHeader>
            <SheetTitle>Quick tools</SheetTitle>
            <SheetDescription className="sr-only">
              Music controls, quick actions and links.
            </SheetDescription>
          </SheetHeader>
          <div className="px-6">
            <ToolsContent run={run} />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        aria-label="Quick tools"
        className="max-h-[var(--radix-popover-content-available-height)] w-[360px] max-w-[calc(100vw-2rem)] overflow-y-auto"
        onCloseAutoFocus={onCloseAutoFocus}
      >
        <h2 className="font-semibold">Quick tools</h2>
        <ToolsContent run={run} />
      </PopoverContent>
    </Popover>
  );
}
