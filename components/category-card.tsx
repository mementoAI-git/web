import { StaticImport } from "next/dist/shared/lib/get-img-props"
import Image from "next/image"
import Link from "next/link"

interface ICategoryCardProps {
  title: string
  subtitle: string
  image: StaticImport
}
export default function CategoryCard({ image, title, subtitle }: ICategoryCardProps) {
  return (
    <Link href="/explore/categories/1" className="w-full h-[220.89px] overflow-hidden rounded-[10px] relative group cursor-pointer">
      <Image
        src={image}
        alt=""
        className="size-full object-cover object-center transition-transform duration-300 ease-in-out group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 text-white flex items-end p-6">
        <div>
          <h5 className="font-canela font-medium text-xl">{title}</h5>
          <span className="text-sm font-georgia font-light text-gray-50">{subtitle}</span>
        </div>
      </div>
    </Link>
  )
}