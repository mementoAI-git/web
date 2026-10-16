import { Button } from "@/components/ui/button";
import { useRequestRecovery } from "@/hooks/use-request-recovery";
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
  const { data, isLoading, error, mutate } = useSWR(
    endpoint.exploreCategories,
    collectionResponseFetcher<ExploreCategory>,
  );

  const retry = useRequestRecovery("explore-categories", error, mutate, "Categories couldn’t be loaded. Try again.");

  if (!canonicalSlug) {
    return <Navigate to="/explore" replace />;
  }
  if (id !== canonicalSlug) {
    return <Navigate to={`/explore/categories/${canonicalSlug}`} replace />;
  }
  if (isLoading) return <div role="status" className="container py-12 text-text-neutral-weak">Loading category…</div>;
  if (error && !data) return <div className="container py-12"><Button variant="outline" onClick={retry}>Retry loading categories</Button></div>;

  const { categories, usingBundledCatalog } = resolveExploreCatalog(data?.data);
  const category = categories.find((item) => item.slug === canonicalSlug);
  if (!category || !getExploreCategoryArtwork(canonicalSlug)) return <Navigate to="/explore" replace />;

  if (usingBundledCatalog) {
    return (
      <div className="container py-12 space-y-4">
        <h1 className="font-garamond text-3xl text-text-neutral-strong">{category.title}</h1>
        {error ? <Button variant="outline" onClick={retry}>Retry loading categories</Button> : <p role="status" className="text-text-neutral-weak">Questions are temporarily unavailable while Explore is being updated. Please try again shortly.</p>}
        <Link className="inline-flex min-h-11 items-center text-text-brand-strong underline" to="/explore">Back to Explore</Link>
      </div>
    );
  }

  return <CategoryDetails category={category} />;
}
