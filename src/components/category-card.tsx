import { Link } from "react-router-dom";
import { cn, isEmpty } from "@/utility";
import ExploreCategoryImage from "@/features/explore/explore-category-image";
import { getExploreCategoryArtwork } from "@/utility/data/categories";

interface CategoryCardProps {
  variant?: "default" | "overview";
  title?: string | null;
  subtitle: string;
  slug?: string;
  image?: string;
  imageCategory?: string;
  imageLoading?: "eager" | "lazy";
  imageSizes?: string;
  category?: string;
  className?: string;
  href?: string;
}

/** Format a slug or API-provided label for compact topic badges. */
function formatCategory(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/, (c) => c.toUpperCase());
}

export default function CategoryCard({
  variant = "default",
  image,
  imageCategory,
  imageLoading = "lazy",
  imageSizes = "238px",
  slug,
  title = null,
  subtitle,
  category,
  className,
  href = slug ? `/explore/categories/${slug}` : "/explore",
}: CategoryCardProps) {
  const hasResponsiveArtwork = Boolean(
    getExploreCategoryArtwork(imageCategory),
  );

  return (
    <Link
      to={href}
      className={cn(
        "group flex overflow-hidden flex-col gap-3 size-full cursor-pointer",
        { [className]: !isEmpty(className) },
      )}
    >
      {/* Image wrapper — category tag positioned absolute top-left */}
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-[8px]",
          variant === "overview"
            ? "h-[138px]"
            : "h-[132px] sm:h-[152px] md:h-[164px]",
        )}
      >
        {hasResponsiveArtwork && imageCategory ? (
          <ExploreCategoryImage
            slug={imageCategory}
            alt=""
            sizes={imageSizes}
            loading={imageLoading}
            className="size-full object-cover object-center transition-transform duration-300 ease-in-out group-hover:scale-110"
          />
        ) : image ? (
          <img
            src={image}
            alt={title || subtitle}
            loading={imageLoading}
            decoding="async"
            className="size-full object-cover object-center transition-transform duration-300 ease-in-out group-hover:scale-110"
          />
        ) : null}
        {category && (
          <div
            className={cn(
              "absolute rounded-full bg-fill-topic-badge backdrop-blur-sm",
              variant === "overview"
                ? "left-2 top-2 px-2 py-0.5"
                : "left-2.5 top-2.5 px-2.5 py-1",
            )}
          >
            <span
              className={cn(
                "font-inter text-topic-badge",
                variant === "overview"
                  ? "text-xs font-medium leading-[18px]"
                  : "text-[11px] font-semibold leading-none",
              )}
            >
              {formatCategory(category)}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2 font-garamond text-text-neutral-strong">
        {title && <h5 className="font-semibold text-2xl">{title}</h5>}
        <span
          className={cn(
            "line-clamp-3 text-[16px] font-normal sm:text-[18px]",
            variant === "overview" ? "font-garamond leading-6 text-text-neutral-strong" : "font-georgia text-text-neutral-weak",
          )}
        >
          {subtitle}
        </span>
      </div>
    </Link>
  );
}
