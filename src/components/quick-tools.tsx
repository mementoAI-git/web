import "@/components/motion/navigation-motion.css";
import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";
import { isSkyCardPage } from "@/pages/dashboard/component/sky-card-page";
import type { ReactNode } from "react";
import { useState } from "react";
import { LayoutGrid, SlidersHorizontal } from "lucide-react";
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
import { ThemeSwitcher } from "@/components/theme-switcher";
import BackgroundMusic from "@/components/modal/chat-settings/background-music";
import { useIsMobile } from "@/hooks/use-mobile";
import { bottomSheetClass } from "@/components/ui/bottom-sheet-class";
import { useModal } from "@/hooks/use-modal";
import quickNoteIcon from "@/assets/icon/emojione_memo.svg";
import addPeopleIcon from "@/assets/icon/fluent-emoji-flat_person-medium.svg";

function ToolsContent({
  run,
  stacked = false,
}: {
  run: (action: () => void) => void;
  /** Phones list the actions as short rows instead of two tall tiles. */
  stacked?: boolean;
}) {
  const { open } = useModal();
  return (
    <div className="flex flex-col gap-4">
      <BackgroundMusic compact />
      <section className="flex flex-col gap-2" aria-label="Quick actions">
        <h3 className="text-xs font-medium text-muted-foreground">
          Quick actions
        </h3>
        <div className={cn("grid gap-3", stacked ? "grid-cols-1" : "grid-cols-2")}>
          {[
            {
              label: "Quick note",
              icon: quickNoteIcon,
              action: () => open("quick-capture"),
            },
            {
              label: "Add people",
              icon: addPeopleIcon,
              action: () => open("add-beneficiary"),
            },
          ].map(({ label, icon, action }) => (
            <Button
              key={label}
              type="button"
              variant="ghost"
              className={cn(
                "sky-card relative w-full min-w-0 gap-3 overflow-hidden rounded-xl border border-stroke-neutral-weak bg-fill-neutral-weak p-3 text-text-neutral-strong hover:bg-fill-neutral-weak",
                stacked
                  ? "h-auto flex-row items-center justify-start"
                  : "h-[85px] flex-col items-start justify-between",
              )}
              title={label}
              onClick={() => run(action)}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -inset-4 -skew-x-6 opacity-40"
                style={{
                  backgroundImage:
                    "linear-gradient(var(--stroke-neutral-weaker) 1px, transparent 1px), linear-gradient(90deg, var(--stroke-neutral-weaker) 1px, transparent 1px)",
                  backgroundSize: "32px 32px",
                }}
              />
              <img
                src={icon}
                alt=""
                aria-hidden="true"
                className="relative size-6 shrink-0"
              />
              <span className="relative text-sm font-medium leading-5">
                {label}
              </span>
            </Button>
          ))}
          {/* Phones have no theme switcher in the header. */}
          {stacked && (
            <ThemeSwitcher
              contentClassName="navigation-menu z-[60]"
              renderTrigger={(currentLabel) => (
                <Button
                  type="button"
                  variant="ghost"
                  aria-label={`Theme: ${currentLabel}`}
                  className="sky-card relative h-auto w-full min-w-0 flex-row items-center justify-start gap-3 overflow-hidden rounded-xl border border-stroke-neutral-weak bg-fill-neutral-weak p-3 text-text-neutral-strong hover:bg-fill-neutral-weak"
                >
                  <span aria-hidden="true" className="relative flex size-6 shrink-0 items-center justify-center text-xl leading-none">
                    🌗
                  </span>
                  <span className="relative text-sm font-medium leading-5">Theme</span>
                  <span className="relative ml-auto truncate text-sm font-normal text-text-neutral-weak">{currentLabel}</span>
                </Button>
              )}
            />
          )}
        </div>
      </section>
    </div>
  );
}

export function QuickTools({
  className,
  overview = false,
  contentClassName,
  icon,
}: {
  className?: string;
  contentClassName?: string;
  overview?: boolean;
  icon?: ReactNode;
} = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();
  const { pathname } = useLocation();
  const cardScope = isSkyCardPage(pathname) ? "" : undefined;
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
      {icon ??
        (overview ? (
          <LayoutGrid aria-hidden />
        ) : (
          <SlidersHorizontal aria-hidden />
        ))}
    </Button>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent
          side="bottom"
          data-sky-card-page={cardScope}
          className={cn(
            bottomSheetClass,
            contentClassName,
          )}
          onCloseAutoFocus={onCloseAutoFocus}
        >
          <SheetHeader>
            <SheetTitle>Quick tools</SheetTitle>
            <SheetDescription className="sr-only">
              Music controls and quick actions.
            </SheetDescription>
          </SheetHeader>
          <div className="px-6">
            <ToolsContent run={run} stacked />
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
        data-sky-card-page={cardScope}
        className={cn(
          "sky-card quick-tools-panel navigation-menu max-h-[var(--radix-popover-content-available-height)] w-[315px] max-w-[calc(100vw-2rem)] overflow-y-auto",
          contentClassName,
        )}
        onCloseAutoFocus={onCloseAutoFocus}
      >
        <h2 className="font-semibold">Quick tools</h2>
        <ToolsContent run={run} />
      </PopoverContent>
    </Popover>
  );
}
