import { cn, isEmpty } from "@/utility"
import Link from "next/link"

interface ICategoryCardProps {
  title: string
  subtitle: string
  slug: string
  image: string
  className?: string
}

export default function CategoryCard({ image, slug, title, subtitle, className }: ICategoryCardProps) {
  return (
    <Link
      href={`/explore/categories/${slug}`}
      className={cn("group flex overflow-hidden flex-col gap-4 size-full cursor-pointer", { [className]: !isEmpty(className) })}
    >
      <img
        src={image}
        alt={title}
        className="size-full h-[164px] object-cover object-center transition-transform duration-300 ease-in-out group-hover:scale-110"
      />
      <div className="flex font-garamond text-gray-950/90 flex-col gap-2">
        <h5 className="font-semibold  text-2xl">{title}</h5>
        <span className="text-xl">{subtitle}</span>
      </div>
    </Link>
  )
}