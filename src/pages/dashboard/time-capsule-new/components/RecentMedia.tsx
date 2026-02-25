type MediaItem = {
  id: string;
  _id?: string;
  type: "video" | "image" | "audio";
  thumbnail: string;
  title?: string;
  url?: string;
  name?: string;
  duration?: number;
};

interface RecentMediaProps {
  items: MediaItem[];
  selectedItems?: string[];
  onSelect?: (item: MediaItem) => void;
  onSeeMore?: () => void;
}

export default function RecentMedia({
  items = [],
  selectedItems = [],
  onSelect,
  onSeeMore,
}: RecentMediaProps) {
  const displayedItems = items?.slice(0, 4) || [];
  const hasMore = (items?.length || 0) > 4;

  // Calculate total slots (items + see more button if needed)
  const totalSlots = displayedItems.length + (hasMore ? 1 : 0);

  // Render icon overlay based on media type
  const renderOverlay = (type: MediaItem["type"]) => {
    if (type === "video") {
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-gray-900 ml-1"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      );
    }
    if (type === "audio") {
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            className="w-16 h-16 text-amber-800"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z" />
          </svg>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className="grid gap-3 w-full"
      style={{ gridTemplateColumns: `repeat(${totalSlots}, 1fr)` }}
    >
      {/* Media Items */}
      {displayedItems.map((item) => {
        const isSelected = selectedItems.includes(item.id);
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect?.(item)}
            className={`relative aspect-square rounded-2xl overflow-hidden group cursor-pointer max-w-[90px] max-h-[86px] hover:opacity-90 transition-all ${isSelected
              ? "ring ring-green-0 ring-offset-2"
              : "border border-black/5"
              }`}
          >
            {/* Thumbnail */}
            <img
              src={item?.url}
              alt={item?.title || "Media item"}
              className="size-full object-cover"
            />
            {/* Type-specific overlay */}
            {renderOverlay(item?.type)}
          </button>
        );
      })}

      {/* See More Button */}
      {hasMore && (
        <button
          onClick={onSeeMore}
          className="flex items-center justify-center border border-dashed border-black/10 rounded-lg flex-col gap-1.5 group cursor-pointer hover:bg-gray-50 transition-colors"
        >
          {/* Icon matching avatar */}
          <div className=" rounded-full items-center flex justify-center overflow-hidden transition-transform group-hover:scale-105">
            <img
              src="/icon/plus.svg"
              alt="See all"
              className="w-6 h-6 object-contain"
            />
          </div>
          {/* Text matching structure */}
          <div className="text-center">
            <p className="text-sm font-medium text-orange leading-[18px] whitespace-nowrap">
              See all
            </p>
            {/*<p className="text-xs font-normal text-gray-500 leading-5 invisible">
              &nbsp;
            </p>*/}
          </div>
        </button>
      )}
    </div>
  );
}
