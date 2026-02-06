// components/media-cards/VideoCard.tsx
interface VideoCardProps {
  thumbnail: string;
  title: string;
  onClick?: () => void;
  className?: string;
}

export default function VideoCard({
  thumbnail,
  title,
  onClick,
  className = "",
}: VideoCardProps) {
  return (
    <div className={className}>
      {/* Preview - Fixed 136×162 aspect ratio */}
      <div
        onClick={onClick}
        className="relative w-full aspect-[68/81] rounded-2xl overflow-hidden cursor-pointer group"
      >
        {/* Thumbnail */}
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-110">
            <svg
              className="w-5 h-5 text-gray-900 ml-0.5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
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
