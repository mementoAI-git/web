interface Attachment {
  url: string;
  type: string;
}

interface ImageThumbnailProps {
  images: Attachment[];
  size?: number;
  maxVisible?: number;
  boxClassName?: string;
}

function ImageThumbnail({
  images = [],
  size = 68.78,
  maxVisible = 3,
  boxClassName = "",
}: ImageThumbnailProps) {
  // Filter only image attachments
  const imageAttachments = images.filter((img) => img.type?.includes("image"));

  if (imageAttachments.length === 0) {
    return null;
  }

  const visibleImages = imageAttachments.slice(0, maxVisible);
  const remainingCount = imageAttachments.length - maxVisible;

  return (
    <div className="flex items-center">
      {visibleImages.map((image, index) => {
        const isLast = index === visibleImages.length - 1;
        const showCount = isLast && remainingCount > 0;
        const zIndex = visibleImages.length - index;

        return (
          <div
            key={index}
            className={`relative rounded-lg border-2 border-white overflow-hidden ${boxClassName}`}
            style={{
              width: `${size}px`,
              height: `${size}px`,
              marginLeft: index === 0 ? "0" : "-12px",
              zIndex: zIndex,
            }}
          >
            <img
              src={image.url}
              alt={`Attachment ${index + 1}`}
              className="w-full h-full object-cover"
            />

            {showCount && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  +{remainingCount}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default ImageThumbnail;
