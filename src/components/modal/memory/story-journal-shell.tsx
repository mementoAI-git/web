import type { ComponentProps, KeyboardEventHandler, ReactNode } from "react";
import albumArtwork from "@/assets/image/HD Album story bg memento.webp";
import darkAlbumArtwork from "@/assets/image/HD Album story bg memento dark.webp";
import scenicBackground from "@/assets/image/bg/1.webp";
import paperGrain from "@/assets/image/story-paper-grain.svg";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/utility";
import { useModal } from "@/hooks/use-modal";
import { useTheme } from "@/contexts/theme";
import { AlbumCover } from "./album-cover";

interface StoryJournalShellProps {
  children: ReactNode;
  sidebar?: ReactNode;
  onKeyDown?: KeyboardEventHandler<HTMLElement>;
  presentation?: "original" | "overlay-b" | "overlay-c" | "page";
  onClose?: () => void;
  onEscapeKeyDown?: ComponentProps<typeof DialogContent>["onEscapeKeyDown"];
  title?: string;
  description?: string;
}

export function StoryJournalShell({
  children,
  sidebar,
  onKeyDown,
  presentation = "original",
  onClose,
  onEscapeKeyDown,
  title = "Add Story",
  description = "Write a story, manage its details, and publish when ready.",
}: StoryJournalShellProps) {
  const { resolvedTheme } = useTheme();
  const { state } = useModal();
  // Only step back for a modal on top. Insights can wait underneath the viewer.
  // Share's dialog already layers above this one, and stepping back would remount the story.
  const hasStackedModal =
    state.length > 1 &&
    state[0]?.name !== "create-memory" &&
    state[0]?.name !== "view-memory" &&
    state[0]?.name !== "share-memory";
  // The grain's transparent left region follows the WebP's exact source coordinates,
  // so object-cover cropping never puts texture on the leather or chrome.
  const paperTexture = resolvedTheme === "light" ? (
    <img
      data-testid="desktop-paper-grain"
      src={paperGrain}
      alt=""
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 size-full object-cover object-left-top",
        presentation !== "original" ? "rounded-3xl" : "rounded-l-none rounded-r-[30px]",
      )}
      style={{ opacity: 0.1 }}
    />
  ) : null;

  if (presentation !== "original") {
    const page = <>
      <img
        data-testid="desktop-album-artwork"
        src={resolvedTheme === "dark" ? darkAlbumArtwork : albumArtwork}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 size-full rounded-3xl object-cover object-left-top"
      />
      {paperTexture}
      {children}
    </>;
    // Public story links have no app behind them, so the album is the page.
    if (presentation === "page") {
      return (
        <main
          data-testid="desktop-journal-shell"
          data-story-presentation={presentation}
          className="add-story-journal relative mx-auto h-full w-full max-w-[1120px] overflow-hidden rounded-3xl border border-stroke-neutral-weak bg-bg-neutral shadow-2xl"
        >
          {page}
        </main>
      );
    }
    return (
      <Dialog open modal={!hasStackedModal} onOpenChange={(open) => { if (!open && !hasStackedModal) onClose?.(); }}>
        <DialogContent
          data-testid="desktop-journal-shell"
          data-story-presentation={presentation}
          showCloseButton={false}
          overlayClassName={cn("bg-overlay-backdrop", hasStackedModal ? "z-[90]" : "z-[105]")}
          className={cn("add-story-journal block p-0", presentation === "overlay-c" ? "album-c-shell" : "h-[min(820px,calc(100dvh-48px))] w-[calc(100vw-48px)] max-w-[1120px] overflow-hidden rounded-3xl border border-stroke-neutral-weak bg-bg-neutral shadow-2xl sm:max-w-[1120px]", hasStackedModal ? "z-[95]" : "z-[110]")}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={onKeyDown}
          onInteractOutside={(event) => { if (hasStackedModal) event.preventDefault(); }}
          onEscapeKeyDown={(event) => {
            if (hasStackedModal) return;
            // The composer owns its draft-aware close guard.
            event.preventDefault();
            event.stopPropagation();
            if (onEscapeKeyDown) onEscapeKeyDown(event);
            else onClose?.();
          }}
        >
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <DialogDescription className="sr-only">{description}</DialogDescription>
          {presentation === "overlay-c" ? <AlbumCover sidebar={sidebar}>{children}</AlbumCover> : page}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div
      data-testid="desktop-story-environment"
      data-story-journal="true"
      className="absolute inset-0 overflow-auto bg-cover bg-center py-4 pl-0 pr-4 xl:py-9 xl:pl-0 xl:pr-9 min-[1900px]:px-9"
      style={{
        backgroundImage: `linear-gradient(rgba(18, 12, 8, 0.22), rgba(18, 12, 8, 0.22)), url(${scenicBackground})`,
      }}
      onClick={(event) => event.stopPropagation()}
    >
      <main
        data-testid="desktop-journal-shell"
        className="add-story-journal relative mx-0 h-[calc(100dvh-32px)] min-h-[720px] w-full max-w-[1440px] overflow-hidden rounded-l-none rounded-r-[30px] shadow-[0_28px_80px_rgba(20,12,7,0.28)] xl:h-[calc(100dvh-72px)] min-[1900px]:mx-auto"
        onKeyDown={onKeyDown}
      >
        <img
          data-testid="desktop-album-artwork"
          src={resolvedTheme === "dark" ? darkAlbumArtwork : albumArtwork}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 size-full rounded-l-none rounded-r-[30px] object-cover object-left-top"
        />
        {paperTexture}
        {children}
      </main>
    </div>
  );
}
