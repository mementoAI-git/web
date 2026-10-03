import { Link } from "react-router-dom";
import { cn, isEmpty } from "@/utility";

interface CategoryCardProps {
  title?: string | null;
  subtitle: string;
  slug?: string;
  image: string;
  category?: string;
  className?: string;
  href?: string;
}

/** Format a slug or API-provided label for compact topic badges. */
function formatCategory(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/, (c) => c.toUpperCase());
}

export default function CategoryCard({
  image,
  slug,
  title = null,
  subtitle,
  category,
  className,
  href = slug ? `/explore/categories/${slug}` : "/explore",
}: CategoryCardProps) {
  return (
    <Link
      to={href}
      className={cn("group flex overflow-hidden flex-col gap-3 size-full cursor-pointer", { [className]: !isEmpty(className) })}
    >
      {/* Image wrapper — flat (no radius), category tag positioned absolute top-left */}
      <div className="relative h-[132px] w-full overflow-hidden sm:h-[152px] md:h-[164px]">
        <img
          src={image}
          alt={title || subtitle}
          className="size-full object-cover object-center transition-transform duration-300 ease-in-out group-hover:scale-110"
        />
        {category && (
          <div className="absolute left-2.5 top-2.5 rounded-full bg-white/90 px-2.5 py-1 backdrop-blur-sm">
            <span className="font-inter text-[11px] font-semibold leading-none text-gray-950/80">
              {formatCategory(category)}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2 font-garamond text-text-neutral-strong">
        {title && (
          <h5 className="font-semibold text-2xl">{title}</h5>
        )}
        <span className="line-clamp-3 font-georgia text-[16px] font-normal text-text-neutral-strong sm:text-[18px]">
          {subtitle}
        </span>
      </div>
    </Link>
  );
}
