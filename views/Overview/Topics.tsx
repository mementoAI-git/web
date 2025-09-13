import CategoryCard from "@/components/category-card"
import categories from "@/utility/data/categories.json"
import Link from "next/link"

export default function BrowseTopics() {
  return (
    <div className="w-full space-y-6 py-6 sm:py-9 lg:py-12">
      <div className="flex items-center justify-between">
        <h2 className="font-canela text-sand-12 font-normal text-xl sm:text-2xl lg:text-[32px] leading-[38px]">
          Browse conversations
          <i className="text-gray-500"> by topics</i>
        </h2>
        <Link className="text-blue-6 font-semibold text-lg underline" href="/explore">See all</Link>
      </div>
      <div className="relative w-full">
        <div className="flex flex-col gap-6 sm:flex-row sm:overflow-x-auto hide-scrollbar py-4">
          {
            Object.values(categories)
              .splice(0, 5)
              .map((category, i) => (
                <CategoryCard key={i} className="sm:!max-w-[427px] shrink-0 !w-full" {...category} />
              ))
          }
        </div>

        <div className="absolute hidden md:block  right-0 top-0 bottom-4 w-16 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
      </div>
    </div>
  )
}