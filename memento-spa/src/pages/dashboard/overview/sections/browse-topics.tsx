import { Link } from "react-router-dom";
import useSWR from "swr";
import endpoint from "@/api/endpoint";
import { fetcher } from "@/api/fetcher";
import CategoryCard from "@/components/category-card";
import { TopicSkeleton } from "@/components/topic";
import { getCategory } from "@/utility";

interface Suggestion {
  _id: string;
  title: string;
  category: string;
}

interface SuggestionsResponse {
  data?: {
    docs?: Suggestion[];
  };
}

export default function BrowseTopics() {
  const { data, isLoading } = useSWR<SuggestionsResponse>(
    `${endpoint.suggestions}?page=1&limit=10`,
    fetcher,
  );

  return (
    <div className="w-full py-6 sm:py-9 lg:py-12">
      <div className="flex items-center justify-between">
        <h2 className="font-canela text-xl font-normal leading-[38px] text-sand-12 sm:text-2xl lg:text-[32px]">
          Browse conversations
          <i className="text-gray-500"> by topics</i>
        </h2>
        <Link className="text-lg font-semibold text-blue-6 underline" to="/explore">
          See all
        </Link>
      </div>
      <div className="relative w-full">
        <div className="relative w-full">
          <div className="hide-scrollbar flex gap-6 overflow-x-auto py-4">
            {isLoading ? (
              <>
                <TopicSkeleton />
                <TopicSkeleton />
                <TopicSkeleton />
                <TopicSkeleton />
              </>
            ) : (
              data?.data?.docs?.map((suggestion) => {
                const category = getCategory(suggestion.category);
                return (
                  <div
                    className="flex w-full max-w-[240px] shrink-0"
                    key={suggestion._id}
                  >
                    <CategoryCard
                      subtitle={suggestion.title}
                      href={`/chat/reply/${suggestion._id}`}
                      image={category?.icon ?? ""}
                      className="w-full max-w-[240px]"
                    />
                  </div>
                );
              })
            )}
          </div>
          <div className="pointer-events-none absolute right-0 top-0 hidden h-full w-16 bg-gradient-to-l from-background to-transparent md:block" />
        </div>
      </div>
    </div>
  );
}

