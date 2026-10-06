import DailyPromptSection from "../overview/sections/daily-prompt-section";
import { Link } from "react-router-dom";
import useSWR from "swr";
import CategoryCard from "@/components/category-card";
import endpoint from "@/api/endpoint";
import { collectionResponseFetcher } from "@/api/domain-fetchers";
import { TypographyH2 } from "@/components/ui/typography";
import { getExploreCategoryArtwork } from "@/utility/data/categories";
import type { ExploreCategory } from "@/features/explore/explore-types";
import { resolveExploreCatalog } from "@/features/explore/explore-catalog";

export default function ExplorePage() {
  const { data: categoryResponse, isLoading: categoriesLoading } = useSWR(
    endpoint.exploreCategories,
    collectionResponseFetcher<ExploreCategory>,
  );
  const { categories, usingBundledCatalog } = resolveExploreCatalog(
    categoryResponse?.data,
  );

  return (
    <div className="page-viewport hide-scrollbar">
      <div className="container">
        <div className="mx-auto w-full max-w-[900px] pt-6 md:pt-12">
          <DailyPromptSection />
        </div>

        <div className="space-y-6 py-6 md:py-12">
          <div className="flex w-full items-center justify-between">
            <TypographyH2 className="font-garamond text-[30px] leading-[32px] text-text-neutral-strong sm:text-[40px] sm:leading-[48px]">
              Explore categories
            </TypographyH2>
            <Link
              to="/explore/categories"
              className="hidden text-lg font-inter font-semibold text-blue-6 underline"
            >
              See all
            </Link>
          </div>

          {!categoriesLoading && usingBundledCatalog && (
            <p role="status" className="text-sm text-text-neutral-weak">
              Questions are temporarily unavailable while Explore is being
              updated.
            </p>
          )}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 md:gap-10">
            {categories.map((category, index) => {
              if (!getExploreCategoryArtwork(category.slug)) return null;
              return (
                <CategoryCard
                  key={category.slug}
                  slug={category.slug}
                  title={category.title}
                  subtitle={category.description}
                  imageCategory={category.slug}
                  imageLoading={index === 0 ? "eager" : "lazy"}
                  imageSizes="(min-width: 1280px) 384px, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
