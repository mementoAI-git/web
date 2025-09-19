import ChevronDownIcon from "@/public/icon/chevron-down.svg"

import neutral from "@/public/image/temperament/witty.png"
import friendly from "@/public/image/temperament/critical.png"
import witty from "@/public/image/temperament/witty.png"
import whimsical from "@/public/image/temperament/whimsical.png"
import professional from "@/public/image/temperament/professional.png"
import skeptical from "@/public/image/temperament/skeptical.png"
import critical from "@/public/image/temperament/critical.png"
import philosophical from "@/public/image/temperament/philosophical.png"
import Image from "next/image"

const temperaments = [
  { image: neutral, title: "neutral" },
  { image: friendly, title: "friendly" },
  { image: witty, title: "witty" },
  { image: whimsical, title: "whimsical" },
  { image: professional, title: "professional" },
  { image: skeptical, title: "skeptical" },
  { image: critical, title: "critical" },
  { image: philosophical, title: "philosophical" }
]

export default function Temperament() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-medium text-secondary text-xl">AI Temperament</span>
        <ChevronDownIcon width={12} height={12} />
      </div>
      <div className="grid grid-cols-2 w-full gap-3">
        {
          temperaments.map((t, i) => (
            <div key={i} className="h-37 min-w-52.5 rounded-xl bg-grey-400 border-0 hover:border-2 border-primary flex items-end p-5 relative overflow-hidden">
              <Image src={t.image} width={117} alt={t.title} className="absolute size-29 -top-[33px] -left-[14px]" />
              <span className="capitalize text-[#565C79]">{t.title}</span>
            </div>
          ))
        }
      </div>
    </div>
  )
}