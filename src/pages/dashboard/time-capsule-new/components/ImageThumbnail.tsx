"use client";

import { useState } from "react";
import { cn } from "@/utility";
import { VideoIcon, MicIcon, FileIcon, ImageIcon } from "@/components/icons";

interface ImageThumbnailProps {
  images: Array<{
    url?: string;
    type?: string;
    name?: string;
    _id?: string;
  }>;
  size?: number;
  boxClassName?: string;
  className?: string;
  overlap?: number;
  maxDisplay?: number;
  borderWidth?: number;
  single?: boolean; // New prop for single full-width image
  aspectRatio?: string; // Optional aspect ratio for single mode
}

export default function ImageThumbnail({
  images,
  size = 68.78,
  boxClassName = "",
  className = "",
  overlap = 0,
  maxDisplay = 3,
  borderWidth = 2,
  single = false,
  aspectRatio = "1/1",
}: ImageThumbnailProps) {
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const getExtension = (url?: string) => {
    if (!url) return "";
    return url.split(".").pop()?.toLowerCase() || "";
  };

  const getMediaIcon = (type?: string, url?: string, iconSize: number = 24) => {
    const ext = getExtension(url);
    const isVideo = type?.startsWith("video/") || ["mp4", "mov", "webm", "ogg"].includes(ext);
    const isAudio = type?.startsWith("audio/") || ["mp3", "wav", "m4a"].includes(ext);
    const isPdf = type === "application/pdf" || ext === "pdf";

    if (isVideo)
      return <VideoIcon width={iconSize} height={iconSize} className="text-blue-6" />;
    if (isAudio)
      return <MicIcon width={iconSize} height={iconSize} className="text-orange" />;
    if (isPdf)
      return <FileIcon width={iconSize} height={iconSize} className="text-danger" />;
    return <ImageIcon width={iconSize} height={iconSize} className="text-gray-400" />;
  };

  const isImage = (type?: string, url?: string) => {
    if (type) return type.startsWith("image/");
    const ext = getExtension(url);
    return ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext) || !ext;
  };

  // Single mode: only show first image, full width
  if (single) {
    const image = images[0];
    if (!image) return null;

    const imageId = image._id || image.url || "single";
    const hasFailed = failedImages.has(imageId);
    const showImage = isImage(image.type, image.url) && !hasFailed;

    return (
      <div className={cn("w-full", className)}>
        <div
          className={cn(
            "relative w-full overflow-hidden bg-gray-50 flex items-center justify-center",
            "rounded-[12px] border-white shadow-sm",
            boxClassName,
          )}
          style={{
            aspectRatio,
            borderWidth,
            borderStyle: "solid",
          }}
        >
          {showImage ? (
            <img
              src={image.url}
              alt={image.name || "Image"}
              className="w-full h-full object-cover"
              onError={() =>
                setFailedImages((prev) => new Set(prev).add(imageId))
              }
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-50">
              {getMediaIcon(image.type, image.url, 32)}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Multi-image stacked mode (original behavior)
  const displayImages = images.slice(0, maxDisplay);
  const remainingCount = images.length - maxDisplay;
  const hasMore = remainingCount > 0;

  const handleImageError = (id: string) => {
    setFailedImages((prev) => new Set(prev).add(id));
  };

  return (
    <div
      className={cn("flex items-center", className)}
      style={{
        width: size + (displayImages.length - 1) * (size - overlap),
      }}
    >
      {displayImages.map((image, index) => {
        const isLastVisible = index === displayImages.length - 1;
        const showOverlay = isLastVisible && hasMore;
        const imageId = image._id || image.url || index.toString();
        const hasFailed = failedImages.has(imageId);
        const showImage = isImage(image.type, image.url) && !hasFailed;

        return (
          <div
            key={imageId}
            className={cn(
              "relative rounded-[12px] overflow-hidden bg-gray-50 shrink-0 flex items-center justify-center",
              "border-white shadow-sm",
              boxClassName,
            )}
            style={{
              width: size,
              height: size,
              marginLeft: index > 0 ? -overlap : 0,
              zIndex: displayImages.length - index,
              borderWidth,
              borderStyle: "solid",
            }}
          >
            {showImage ? (
              <>
                <img
                  src={image.url}
                  alt={image.name || `Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={() => handleImageError(imageId)}
                  loading="lazy"
                />

                {showOverlay && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-normal text-sm">
                      +{remainingCount}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-50 relative">
                {getMediaIcon(image.type, image.url, size * 0.4)}
                {showOverlay && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-normal text-sm">
                      +{remainingCount}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
