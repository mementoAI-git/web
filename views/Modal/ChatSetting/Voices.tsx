import Image from "next/image";
import denverIcon from "@/public/image/voices/denver.jpg"
import sueIcon from "@/public/image/voices/sue.jpg"
import josefIcon from "@/public/image/voices/josef.jpg"
import hannahIcon from "@/public/image/voices/hannah.jpg"

export default function Voices() {
  return (
    <div className="space-y-5">
      <p className="text-sand-12 font-canela text-xl">AI Voice</p>
      <div className="grid grid-cols-2 gap-3">
        {
          [
            { title: "Denver", subtitle: 'Male v1', image: denverIcon },
            { title: "Sue", subtitle: 'Female v2', image: sueIcon },
            { title: "Josef", subtitle: 'Male v3', image: josefIcon },
            { title: "Hannah", subtitle: 'Female v4', image: hannahIcon }
          ].map(({ title, subtitle, image }, i) => (
            <div key={i} className="border border-[#EAECF0] py-2.5 px-3 rounded-xl flex gap-3 items-center" >
              <Image src={image} width={32} height={32} className="size-8 rounded-full object-cover object-center" alt="Music" />
              <div className="flex flex-col">
                <span className="text-sand-12 font-inter font-medium text-sm">{title}</span>
                <span className="font-inter text-xs text-[#667085]">{subtitle}</span>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  )
}