import image1 from "@/public/image/image-1.jpeg"
import image2 from "@/public/image/image-2.jpeg"
import image3 from "@/public/image/image-3.jpeg"
import Image from "next/image"

interface IImageThumbnail {
  size: number
  boxClassName?: string
}

const imageRotation: Record<number, string> = {
  0: "rotate-[6.76deg] origin-top-left z-30",
  1: "-rotate-[5.65deg] origin-top-right z-20",
  2: "-rotate-[14.14deg] origin-top-right z-10"
}

export default function ImageThumbnail({ size, boxClassName = "" }: IImageThumbnail) {
  return (
    <div className="h-full w-full cursor-pointer">
      <div className="relative">
        {
          [image3, image1, image2].map((img, i) => (
            <div key={i} style={{ width: size }} className={`absolute overflow-hidden top-0 aspect-square border-[1.5px] border-[#F3F3F3] rounded-[5.83px] ${imageRotation[i]} ${boxClassName}`}>
              <Image className="w-full h-full object-cover rounded-[5.83px]" src={img} alt="" />
            </div>
          ))
        }
      </div>
    </div>
  )
}