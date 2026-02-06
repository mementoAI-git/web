// components/media-cards/ImageCard.tsx
interface ImageCardProps {
  src: string;
  title: string;
  onClick?: () => void;
  className?: string;
}

export default function ImageCard({
  src,
  title,
  onClick,
  className = "",
}: ImageCardProps) {
  return (
    <div className={className}>
      {/* Preview - Fixed 136×162 aspect ratio */}
      <div
        onClick={onClick}
        className="relative w-full aspect-[68/81] rounded-2xl overflow-hidden cursor-pointer group"
      >
        {/* Image */}
        <img
          src={src}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Title - Outside the card */}
      <div className="mt-2">
        <span className="inline-block text-center bg-white px-3 py-1.5 rounded-lg text-xs font-medium text-gray-900 shadow-sm line-clamp-2 max-w-full">
          {title}
        </span>
      </div>
    </div>
  );
}
