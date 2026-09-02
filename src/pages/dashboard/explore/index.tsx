import { Link } from "react-router-dom";
import dayjs from "dayjs";
import useSWR from "swr";
import Slider from "@/components/slider";
import CategoryCard from "@/components/category-card";
import categoryData from "@/utility/data/categories";
import endpoint from "@/api/endpoint";
import { collectionResponseFetcher } from "@/api/domain-fetchers";
import type { DashboardPromptSlot } from "@/utility/interface";
import PromptCard from "./prompt-card";
import { TypographyH2 } from "@/components/ui/typography";

const categories = categoryData as Record<string, { title: string; subtitle: string; image: string; slug: string }>;

export default function ExplorePage() {
  const dateKey = dayjs().format("YYYY-MM-DD");
  const promptsUrl = `${endpoint.prompts}?date_key=${encodeURIComponent(dateKey)}`;
  const { data } = useSWR(promptsUrl, collectionResponseFetcher<DashboardPromptSlot>);

  const staticPrompts = ((data?.data ?? []) as DashboardPromptSlot[])
    .filter((row): row is Extract<DashboardPromptSlot, { slot_kind: "static" }> => row.slot_kind === "static")
    .map((row) => row.prompt)
    .filter((p) => Boolean(p?._id));

  return (
    <div className="page-viewport hide-scrollbar">
      <div className="container">
        {staticPrompts.length > 0 && (
          <div className="flex flex-col gap-4 pt-6 sm:gap-10 md:pt-12">
            <div className="font-garamond md:space-y-2">
              <TypographyH2 className="text-2xl text-sand-12 md:text-[32px] md:font-normal md:leading-[48px] md:text-gray-950/90">
                Continue reflecting
              </TypographyH2>
            </div>

            <div className="block md:hidden">
              <Slider>
                {staticPrompts.map((prompt, index) => (
                  <PromptCard key={prompt._id ?? index} {...prompt} />
                ))}
              </Slider>
            </div>

            <div className="hidden items-stretch gap-6 overflow-x-auto hide-scrollbar md:flex">
              {staticPrompts.map((prompt, index) => (
                <PromptCard key={prompt._id ?? index} {...prompt} />
              ))}
            </div>
          </div>
        )}

        <div className="space-y-6 py-6 md:py-12">
          <div className="flex w-full items-center justify-between">
            <TypographyH2 className="font-garamond text-[30px] leading-[32px] text-gray-950/90 sm:text-[40px] sm:leading-[48px] sm:text-gray-950/90">
              Explore categories
            </TypographyH2>
            <Link to="/explore/categories" className="hidden text-lg font-inter font-semibold text-blue-6 underline">
              See all
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 md:gap-10">
            {Object.values(categories).map((category, index) => (
              <CategoryCard key={category.slug ?? index} {...category} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
