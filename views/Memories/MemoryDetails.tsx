import ChevronLeftIcon from "@/public/icon/chevron-left.svg";
import Image from "next/image";
import image1 from "@/public/image/image-1.jpeg";
import image2 from "@/public/image/image-2.jpeg";
import image3 from "@/public/image/image-3.jpeg";

export default function MemoryDetails() {
  return (
    <div className="space-y-3">
      <button className="flex cursor-pointer items-center gap-1 rounded-full bg-grey-400 px-3 py-1.5 text-black">
        <ChevronLeftIcon width={10} height={10} />
        <span className="font-inter text-sm text-grey-600">Back</span>
      </button>
      <span className="font-bricolage text-4xl font-medium text-[#101828]">
        My travel experiences - 2024
      </span>
      <div className="mt-3 border-t border-grey-500" />
      <div className="flex flex-wrap gap-2">
        <Image
          src={image1}
          className="max-h-50 grow rounded-sm border object-cover"
          alt=""
        />
        <Image
          src={image2}
          className="max-h-50 grow rounded-sm border object-cover"
          alt=""
        />
        <Image
          src={image3}
          className="max-h-50 w-1/2 rounded-sm border object-cover"
          alt=""
        />
        <Image
          src={image1}
          className="max-h-50 grow rounded-sm border object-cover"
          alt=""
        />
      </div>
      <div className="font-inter text-sm text-grey-600">
        <span>
          Lorem ipsum dolor sit amet consectetur. Cras aenean libero odio quam
          nisl quisque volutpat sed. Quis phasellus egestas metus eu amet
          ornare. Donec faucibus amet potenti a. Consectetur id felis arcu
          nullam morbi. Tellus cursus nibh massa faucibus. Non proin massa amet
          imperdiet faucibus convallis ridiculus. Vestibulum ut purus faucibus
          id odio aliquam auctor eu nulla. Iaculis massa risus leo arcu risus
          tempus sed. Aliquam ullamcorper dolor neque mauris. Eros id neque
          viverra nisl sit vulputate sit diam iaculis.
        </span>
        <br />
        <br />
        <span>
          Lorem ipsum dolor sit amet consectetur. Cras aenean libero odio quam
          nisl quisque volutpat sed. Quis phasellus egestas metus eu amet
          ornare. Donec faucibus amet potenti a. Consectetur id felis arcu
          nullam morbi. Tellus cursus nibh massa faucibus. Non proin massa amet
          imperdiet faucibus convallis ridiculus. Vestibulum ut purus faucibus
          id odio aliquam auctor eu nulla. Iaculis massa risus leo arcu risus
          tempus sed. Aliquam ullamcorper dolor neque mauris. Eros id neque
          viverra nisl sit vulputate sit diam iaculis. Lorem ipsum dolor sit
          amet consectetur. Cras aenean libero odio quam nisl quisque volutpat
          sed. Quis phasellus egestas metus eu amet ornare. Donec faucibus amet
          potenti a. Consectetur id felis arcu nullam morbi. Tellus cursus nibh
          massa faucibus. Non proin massa amet imperdiet faucibus convallis
          ridiculus. Vestibulum ut purus faucibus id odio aliquam auctor eu
          nulla. Iaculis massa risus leo arcu risus tempus sed. Aliquam
          ullamcorper dolor neque mauris. Eros id neque viverra nisl sit
          vulputate sit diam iaculis.
        </span>
      </div>
    </div>
  );
}
