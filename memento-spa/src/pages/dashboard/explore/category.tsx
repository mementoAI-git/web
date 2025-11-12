import { useMemo } from "react";
import { useParams, Navigate } from "react-router-dom";
import categoryData from "@/utility/data/categories";
import { isEmpty } from "@/utility";
import CategoryDetails from "./category-details";

const categories = categoryData as Record<string, { slug: string; title: string; subtitle: string; image: string }>;

export default function ExploreCategoryPage() {
  const { id = "" } = useParams<{ id: string }>();

  const category = useMemo(() => {
    if (!id) return null;
    return categories[id] ?? null;
  }, [id]);

  if (!category || isEmpty(category)) {
    return <Navigate to="/explore" replace />;
  }

  return <CategoryDetails category={category} />;
}

