"use client"

import { isEmpty } from "@/utility"
import { use } from "react";
import categories from "@/utility/data/categories.json"
import NotFound from "@/app/not-found";
import CategoryDetail from "@/views/Explore/CategoryDetails";

export default function CategoryDetailPage({ params }) {
  const { id } = use(params) as { id: string };
  const category = categories[id]

  if (isEmpty(category)) {
    return <NotFound />
  }

  return <CategoryDetail category={category} />
}