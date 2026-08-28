import type { IFile } from "@/utility/interface";
import { QIcon, PlayIcon, MicIcon } from "@/components/icons";
import { isImage } from "@/pages/dashboard/time-capsule-new/utility/helpers";
import { useSignedMediaAccess } from "@/features/media/signed-media-access";

interface IImageThumbnail {
  size?: number;
  boxClassName?: string;
  images: IFile[];
}

const imageRotation: Record<number, string> = {
  0: "rotate-[6.76deg] origin-top-left z-30",
  1: "-rotate-[5.65deg] origin-top-right z-20",
  2: "-rotate-[14.14deg] origin-top-right z-10",
};

function ImageThumbnailItem({ size = 68.78, ...file }: IFile & { size: number }) {
  const { src, onError } = useSignedMediaAccess(file);
  const { type, name } = file;
  // if (type?.includes("image")) {
  if (isImage(name)) {
    return (
      <img
        width={size}
        height={size}
        className="size-full rounded-[5.83px] object-cover"
        src={src}
        onError={onError}
        alt={name || "memento-image"}
      />
    );
  }
  return (
    <div className="size-full justify-center items-center flex bg-grey-500">
      {type?.includes("video") ? (
        <PlayIcon width={size * 0.6} height={size * 0.6} />
      ) : type?.includes("audio") ? (
        <MicIcon width={size * 0.6} height={size * 0.6} />
      ) : (
        <QIcon width={size * 0.6} height={size * 0.6} />
      )}
    </div>
  );
}

export default function ImageThumbnail({
  images,
  size = 68.78,
  boxClassName = "",
}: IImageThumbnail) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`${images.length <= 1 && "flex items-center justify-center"} cursor-pointer`}
    >
      {images.length === 1 ? (
        <div className="flex items-center justify-center size-full overflow-hidden rounded-[5.83px]">
          <ImageThumbnailItem {...{ ...images[0], size }} />
        </div>
      ) : (
        <div className="relative size-full">
          {images.slice(0, 3).map((img, i) => (
            <div
              key={i}
              style={{ width: size }}
              className={`absolute top-0 aspect-square overflow-hidden rounded-[5.83px] border-[1.5px] border-v3-stroke-weak ${imageRotation[i]} ${boxClassName}`}
            >
              <ImageThumbnailItem {...{ ...img, size }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
