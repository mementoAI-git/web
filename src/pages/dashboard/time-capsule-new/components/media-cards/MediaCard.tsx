// components/media-cards/MediaCard.tsx
import AudioCard from "./AudioCard";
import VideoCard from "./VideoCard";
import ImageCard from "./ImageCard";
import MemoryCard from "./MemoryCard";
import type { CardCustomization } from "../CapsulePreviewCard";

interface MediaCardProps {
  type: "audio" | "video" | "image" | "memory";
  src?: string;
  thumbnail?: string;
  duration?: string;
  title: string;
  onClick?: () => void;
  className?: string;
  style?: CardCustomization;
}

export default function MediaCard({
  type,
  src,
  thumbnail,
  duration,
  title,
  onClick,
  style,
  className = "",
}: MediaCardProps) {
  const mediaSrc = src || thumbnail || "";

  switch (type) {
    case "audio":
      return (
        <AudioCard
          duration={duration || "00:00"}
          title={title}
          onClick={onClick}
          style={style}
          className={`${className}`}
        />
      );
    case "video":
      return (
        <VideoCard
          thumbnail={mediaSrc}
          title={title}
          onClick={onClick}
          style={style}
          className={className}
        />
      );
    case "image":
      return (
        <ImageCard
          src={mediaSrc}
          title={title}
          onClick={onClick}
          style={style}
          className={className}
        />
      );
    case "memory":
      return (
        <MemoryCard
          thumbnail={mediaSrc}
          title={title}
          onClick={onClick}
          className={className}
        />
      );
    default:
      return null;
  }
}
