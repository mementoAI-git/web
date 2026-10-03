import type { ImgHTMLAttributes } from "react";
import { getExploreCategoryArtwork } from "@/utility/data/categories";

interface ExploreCategoryImageProps {
  slug: string;
  alt?: string;
  sizes: string;
  loading?: "eager" | "lazy";
  className?: string;
}

export default function ExploreCategoryImage({
  slug,
  alt = "",
  sizes,
  loading = "lazy",
  className,
}: ExploreCategoryImageProps) {
  const artwork = getExploreCategoryArtwork(slug);
  if (!artwork) return null;

  const fetchPriority: ImgHTMLAttributes<HTMLImageElement>["fetchPriority"] = loading === "eager" ? "high" : undefined;

  return (
    <img
      src={artwork.src}
      srcSet={artwork.srcSet}
      sizes={sizes}
      width={artwork.width}
      height={artwork.height}
      alt={alt}
      loading={loading}
      fetchPriority={fetchPriority}
      decoding="async"
      className={className}
    />
  );
}
