import { useParams, Navigate } from "react-router-dom";
import CategoryDetails from "./category-details";
import useSWR from "swr";
import endpoint from "@/api/endpoint";
import { collectionResponseFetcher } from "@/api/domain-fetchers";
import type { ExploreCategory } from "@/features/explore/explore-types";
import { resolveExploreCatalog } from "@/features/explore/explore-catalog";
import { Link } from "react-router-dom";
import {
  getExploreCategoryArtwork,
  resolveExploreCategorySlug,
} from "@/utility/data/categories";

export default function ExploreCategoryPage() {
  const { id = "" } = useParams<{ id: string }>();

  const canonicalSlug = resolveExploreCategorySlug(id);
  const { data, isLoading } = useSWR(
    endpoint.exploreCategories,
    collectionResponseFetcher<ExploreCategory>,
  );

  if (!canonicalSlug) {
    return <Navigate to="/explore" replace />;
  }
  if (id !== canonicalSlug) {
    return <Navigate to={`/explore/categories/${canonicalSlug}`} replace />;
  }
  if (isLoading) return null;

  const { categories, usingBundledCatalog } = resolveExploreCatalog(data?.data);
  const category = categories.find((item) => item.slug === canonicalSlug);
  if (!category || !getExploreCategoryArtwork(canonicalSlug)) return <Navigate to="/explore" replace />;

  if (usingBundledCatalog) {
    return (
      <div className="container py-12 space-y-4">
        <h1 className="font-garamond text-3xl text-text-neutral-strong">{category.title}</h1>
        <p role="status" className="text-text-neutral-weak">Questions are temporarily unavailable while Explore is being updated. Please try again shortly.</p>
        <Link className="inline-flex min-h-11 items-center text-text-brand-strong underline" to="/explore">Back to Explore</Link>
      </div>
    );
  }

  return <CategoryDetails category={category} />;
}
