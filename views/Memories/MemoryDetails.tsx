import ChevronLeftIcon from "@/public/icon/chevron-left.svg"
import Image from "next/image"
import image1 from "@/public/image/image-1.jpeg"
import image2 from "@/public/image/image-2.jpeg"
import image3 from "@/public/image/image-3.jpeg"

export default function MemoryDetails() {
  return (
    <div className="space-y-3">
      <button className="flex items-center cursor-pointer text-black px-3 py-1.5 bg-grey-400 rounded-full gap-1">
        <ChevronLeftIcon width={10} height={10} />
        <span className="text-grey-600 text-sm font-inter">Back</span>
      </button>
      <span className="text-[#101828] font-bricolage font-medium text-4xl">My travel experiences - 2024</span>
      <div className="border-t border-grey-500 mt-3" />
      <div className="flex gap-2 flex-wrap">
        <Image src={image1} className="grow rounded-sm object-cover border max-h-50" alt="" />
        <Image src={image2} className="grow rounded-sm object-cover border max-h-50" alt="" />
        <Image src={image3} className="w-1/2 rounded-sm object-cover border max-h-50" alt="" />
        <Image src={image1} className="grow rounded-sm object-cover border  max-h-50" alt="" />
      </div>
      <div className="font-inter text-sm text-grey-600">
        <span>
          Lorem ipsum dolor sit amet consectetur. Cras aenean libero odio quam nisl quisque volutpat sed. Quis phasellus egestas metus eu amet ornare. Donec faucibus amet potenti a. Consectetur id felis arcu nullam morbi. Tellus cursus nibh massa faucibus. Non proin massa amet imperdiet faucibus convallis ridiculus. Vestibulum ut purus faucibus id odio aliquam auctor eu nulla. Iaculis massa risus leo arcu risus tempus sed. Aliquam ullamcorper dolor neque mauris. Eros id neque viverra nisl sit vulputate sit diam iaculis.
        </span>
        <br />
        <br />
        <span>
          Lorem ipsum dolor sit amet consectetur. Cras aenean libero odio quam nisl quisque volutpat sed. Quis phasellus egestas metus eu amet ornare. Donec faucibus amet potenti a. Consectetur id felis arcu nullam morbi. Tellus cursus nibh massa faucibus. Non proin massa amet imperdiet faucibus convallis ridiculus. Vestibulum ut purus faucibus id odio aliquam auctor eu nulla. Iaculis massa risus leo arcu risus tempus sed. Aliquam ullamcorper dolor neque mauris. Eros id neque viverra nisl sit vulputate sit diam iaculis. Lorem ipsum dolor sit amet consectetur. Cras aenean libero odio quam nisl quisque volutpat sed. Quis phasellus egestas metus eu amet ornare. Donec faucibus amet potenti a. Consectetur id felis arcu nullam morbi. Tellus cursus nibh massa faucibus. Non proin massa amet imperdiet faucibus convallis ridiculus. Vestibulum ut purus faucibus id odio aliquam auctor eu nulla. Iaculis massa risus leo arcu risus tempus sed. Aliquam ullamcorper dolor neque mauris. Eros id neque viverra nisl sit vulputate sit diam iaculis.
        </span>
      </div>
    </div>
  )
}