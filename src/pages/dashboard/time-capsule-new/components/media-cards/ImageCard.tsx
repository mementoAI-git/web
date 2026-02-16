import TextHighlight from "../TextHighlight";
import { getAdjustedBackground } from "./helpers";
import type { CardCustomization } from "../CapsulePreviewCard";

interface ImageCardProps {
  src: string;
  title: string;
  onClick?: () => void;
  className?: string;
  style?: CardCustomization;
}

export default function ImageCard({
  src,
  title,
  style,
  onClick,
  className = "",
}: ImageCardProps) {
  return (
    <div className={`${className} overflow-hidden`}>
      {/* Preview - Fixed 136×162 aspect ratio */}
      <div
        onClick={onClick}
        className="relative w-full aspect-68/81 mb-3 rounded-2xl overflow-hidden cursor-pointer group"
      >
        {/* Image */}
        <img
          src={src}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      {/* Title - Outside the card */}
      <TextHighlight
        style={{
          backgroundColor: getAdjustedBackground(
            style?.backgroundColor,
            style?.textColor || "#ffffff",
          ),
        }}
      >
        {title}
      </TextHighlight>
    </div>
  );
}
