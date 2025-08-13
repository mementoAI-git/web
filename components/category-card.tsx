import { StaticImport } from "next/dist/shared/lib/get-img-props"
import Image from "next/image"

interface ICategoryCardProps {
  title: string
  subtitle: string
  image: StaticImport
}
export default function CategoryCard({ image, title, subtitle }: ICategoryCardProps) {
  return (
    <div className="w-full h-[220.89px] overflow-hidden rounded-[10px] max-w-[427px] relative">
      <Image src={image} alt="" className="size-full object-cover object-center" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 text-white flex items-end p-6">
        <div>
          <h5 className="font-canela font-medium text-xl">{title}</h5>
          <span className="text-sm font-georgia font-light text-gray-50">{subtitle}</span>
        </div>
      </div>
    </div>
  )
}