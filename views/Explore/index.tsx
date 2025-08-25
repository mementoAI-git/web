"use client"

import image6 from "@/public/image/image-6.png"
import familyImage from "@/public/image/family-friends.png"
import findingPurposeImage from "@/public/image/finding-purpose.png"
import worldViewImage from "@/public/image/world-veiw.png"
import loveImage from "@/public/image/love-relationship.png"
import faithImage from "@/public/image/faith.png"
import PromptCard from "./prompt-card";
import CategoryCard from "@/components/category-card"
import Slider from "@/components/Slider"
import Link from "next/link"

const categories = [
  {
    title: "Career and ambition",
    image: image6,
    subtitle: "The aspirations and goals you've set to achieve professional success and personal fulfillment."
  },
  {
    title: "Family life",
    image: familyImage,
    subtitle: "The aspirations and goals you've set to achieve professional success and personal fulfillment."
  },
  {
    title: "Finding love & relationships",
    image: loveImage,
    subtitle: "The aspirations and goals you've set to achieve professional success and personal fulfillment."
  },
  {
    title: "Faith and religious beliefs",
    image: faithImage,
    subtitle: "The aspirations and goals you've set to achieve professional success and personal fulfillment."
  },
  {
    title: "Worldviews & beliefs",
    image: worldViewImage,
    subtitle: "The aspirations and goals you've set to achieve professional success and personal fulfillment."
  },
  {
    title: "Finding purpose",
    image: findingPurposeImage,
    subtitle: "The aspirations and goals you've set to achieve professional success and personal fulfillment."
  }
];

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
            {categories.map((category, index) => (
              <CategoryCard key={index}{...category} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
