import type { ReactNode } from "react";
import referenceAlbum from "@/assets/image/story-overlay-c-tall-album.webp";
import "./album-cover.css";

/** Complete reference artwork, with live controls positioned over the blank paper. */
export function AlbumCover({ children, sidebar }: { children: ReactNode; sidebar?: ReactNode }) {
  return (
    <>
      <img
        data-testid="desktop-album-artwork"
        src={referenceAlbum}
        alt=""
        aria-hidden="true"
        className="album-c-artwork"
      />
      <div className="album-c-content">{children}</div>
      {sidebar ? <div className="album-c-sidecar">{sidebar}</div> : null}
    </>
  );
}
