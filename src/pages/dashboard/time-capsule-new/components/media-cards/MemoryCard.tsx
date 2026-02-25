import { DoubleHeartIcon } from "@/components/icons";
import TextHighlight from "../TextHighlight";

interface MemoryCardProps {
  title: string;
  onClick?: () => void;
  className?: string;
  thumbnail?: string;
}

export default function MemoryCard({
  title = "",
  onClick,
  className = "",
  thumbnail,
}: MemoryCardProps) {
  return (
    <div onClick={onClick} className={className}>
      <div className="relative w-full aspect-68/81 mb-3 bg-white rounded-2xl overflow-hidden cursor-pointer group">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-sand-1">
            <DoubleHeartIcon
              width={48}
              height={48}
              className="text-orange opacity-20"
            />
          </div>
        )}

        {/* Memory Indicator Overlay */}
        {/*<div className="absolute top-3 left-3 bg-orange/90 rounded-full p-1.5 shadow-sm">
          <DoubleHeartIcon width={16} height={16} className="text-white" />
        </div>*/}

        {!thumbnail && (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <span className="text-sm font-medium text-gray-400 text-center line-clamp-3">
              {title}
            </span>
          </div>
        )}
      </div>

      <TextHighlight>{title || "Shared Memory"}</TextHighlight>
    </div>
  );
}
