import image1 from "@/public/image/image-1.jpeg";
import image2 from "@/public/image/image-2.jpeg";
import image3 from "@/public/image/image-3.jpeg";
import { IFile } from "@/utility/interface";
import Image from "next/image";
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

function ImageThumbnailItem({
  type,
  url,
  name,
  size = 68.78,
}: IFile & { size: number }) {
  if (type.includes("image")) {
    return (
      <Image
        width={size}
        height={size}
        className="size-full rounded-[5.83px] object-cover"
        src={url}
        alt={name || "memento-image"}
      />
    );
  }
  return <div className="size-full bg-grey-500" />;
}

export default function ImageThumbnail({
  images,
  size = 68.78,
  boxClassName = "",
}: IImageThumbnail) {
  return (
    <div style={{ width: size, height: size }} className="cursor-pointer">
      {images.length === 1 ? (
        <div>
          <ImageThumbnailItem {...{ ...images[0], size }} />
        </div>
      ) : (
        <div className="relative">
          {images.slice(0, 3).map((img, i) => (
            <div
              key={i}
              style={{ width: size }}
              className={`absolute top-0 aspect-square overflow-hidden rounded-[5.83px] border-[1.5px] border-[#F3F3F3] ${imageRotation[i]} ${boxClassName}`}
            >
              <ImageThumbnailItem {...{ ...img, size }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
