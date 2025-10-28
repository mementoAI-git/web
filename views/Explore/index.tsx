"use client"

import PromptCard from "./prompt-card";
import CategoryCard from "@/components/category-card"
import Slider from "@/components/Slider"
import categories from "@/utility/data/categories.json"
import useSWR from "swr";
import endpoint from "@/api/endpoint";

export default function Explore() {
  const { data } = useSWR(endpoint.prompts);
  return (
    <div className="page-viewport hide-scrollbar">
      <div className="container">
        {
          data?.data?.length > 0 &&
          <div className="md:py-12 py-6 flex flex-col sm:gap-10 gap-4">
            <div className="md:space-y-2 font-garamond">
              <h2 className="text-2xl md:text-[40px] md:leading-[48px] md:font-medium text-sand-12 md:text-gray-950/90">Pick up from where you left off. </h2>
              <p className="text-2xl md:text-[24px] md:leading-[32px] text-sand-12 md:text-gray-950/70">Complete some unfinished prompts to earn points.</p>
            </div>

            {/* Mobile Slider View for Prompt Cards */}
            <div className="block md:hidden">
              <Slider>
                {data?.data?.map(({ prompt }, i) => <PromptCard key={i} {...prompt} />)}
              </Slider>
            </div>

            {/* Desktop Grid View for Prompt Cards */}
            <div className="hidden md:flex gap-6 items-stretch overflow-x-auto pb-4 hide-scrollbar">
              {data?.data?.map(({ prompt }, i) => <PromptCard key={i} {...prompt} />)}
            </div>
          </div>
        }

        <div className="md:py-12 py-6 space-y-6">
          <div className="flex w-full items-center justify-between">
            <span className="font-garamond text-gray-950/90 sm:text-[40px] text-[30px] sm:leading-[48px] leading-[32px] font-medium">
              Explore categories
            </span>
            {/* <Link href="/explore/categories" className="text-blue-6 text-lg font-inter font-semibold underline cursor-pointer">
              See all
            </Link> */}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-10">
            {
              Object.values(categories)
                .map((category, index) => <CategoryCard key={index}{...category} />)
            }
          </div>
        </div>
      </div>
    </div>
  );
}
