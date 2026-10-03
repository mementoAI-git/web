import type { KeyboardEventHandler, ReactNode } from "react";
import albumArtwork from "@/assets/image/HD Album story bg memento.png";
import darkAlbumArtwork from "@/assets/image/HD Album story bg memento dark.png";
import scenicBackground from "@/assets/image/bg/1.png";
import { useTheme } from "@/contexts/theme";

interface StoryJournalShellProps {
  children: ReactNode;
  onKeyDown?: KeyboardEventHandler<HTMLElement>;
}

export function StoryJournalShell({ children, onKeyDown }: StoryJournalShellProps) {
  const { resolvedTheme } = useTheme();

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
        {children}
      </main>
    </div>
  );
}
