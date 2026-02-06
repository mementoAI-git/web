// components/media-cards/MediaCard.tsx
import AudioCard from "./AudioCard";
import VideoCard from "./VideoCard";
import ImageCard from "./ImageCard";

interface MediaCardProps {
  type: "audio" | "video" | "image";
  src?: string;
  thumbnail?: string;
  duration?: string;
  title: string;
  onClick?: () => void;
  className?: string;
}

export default function MediaCard({
  type,
  src,
  thumbnail,
  duration,
  title,
  onClick,
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
          className={className}
        />
      );
    case "video":
      return (
        <VideoCard
          thumbnail={mediaSrc}
          title={title}
          onClick={onClick}
          className={className}
        />
      );
    case "image":
      return (
        <ImageCard
          src={mediaSrc}
          title={title}
          onClick={onClick}
          className={className}
        />
      );
    default:
      return null;
  }
}
