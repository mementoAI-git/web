"use client"

import PromptCard from "./prompt-card";
import CategoryCard from "@/components/category-card"
import Slider from "@/components/Slider"
import Link from "next/link"
import categories from "@/utility/data/categories.json"

export default function Explore() {
  return (
    <div className="page-viewport hide-scrollbar">
      <div className="container">
        <div className="py-12 flex flex-col gap-10">
          <div className="space-y-2">
            <h2 className="text-xl md:text-2xl font-canela font-medium text-sand-12">Pick up from where you left off. </h2>
            <span className="text-md sm:text-xl font-canela font-light text-sand-10">Complete some unfinished prompts to earn points.</span>
          </div>

          {/* Mobile Slider View for Prompt Cards */}
          <div className="block md:hidden">
            <Slider>
              <PromptCard />
              <PromptCard />
            </Slider>
          </div>

          {/* Desktop Grid View for Prompt Cards */}
          <div className="hidden md:flex gap-6 items-stretch overflow-x-auto pb-4 hide-scrollbar">
            <PromptCard />
            <PromptCard />
          </div>
        </div>
        <div className="py-12 space-y-6">
          <div className="flex w-full items-center justify-between">
            <span className="font-canela text-sand-12 text-3xl font-medium">
              Explore categories
            </span>
            <Link href="/explore/categories" className="text-blue-6 text-lg font-inter font-semibold underline cursor-pointer">
              See all
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 lg:gap-6">
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
