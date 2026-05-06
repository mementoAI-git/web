import { Link } from "react-router-dom";
import { cn, isEmpty } from "@/utility";

interface CategoryCardProps {
  title?: string | null;
  subtitle: string;
  slug?: string;
  image: string;
  className?: string;
  href?: string;
}

export default function CategoryCard({
  image,
  slug,
  title = null,
  subtitle,
  className,
  href = slug ? `/explore/categories/${slug}` : "/explore",
}: CategoryCardProps) {
  return (
    <Link
      to={href}
      className={cn("group flex overflow-hidden flex-col gap-3 size-full cursor-pointer", { [className]: !isEmpty(className) })}
    >
      <img
        src={image}
        alt={title || subtitle}
        className="size-full h-[132px] object-cover object-center transition-transform duration-300 ease-in-out group-hover:scale-110 sm:h-[152px] md:h-[164px]"
      />
      <div className="flex font-garamond text-gray-950/90 flex-col gap-2">
        {
          title && (
            <h5 className="font-semibold  text-2xl">{title}</h5>
          )
        }
        <span className="font-georgia text-[16px] font-normal text-gray-950/90 line-clamp-3 sm:text-[18px]">{subtitle}</span>
      </div>
    </Link>
  );
}

