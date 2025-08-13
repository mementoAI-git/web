import image6 from "@/public/image/image-6.png"
import familyImage from "@/public/image/family-friends.png"
import findingPurposeImage from "@/public/image/finding-purpose.png"
import worldViewImage from "@/public/image/world-veiw.png"
import loveImage from "@/public/image/love-relationship.png"
import faithImage from "@/public/image/faith.png"
import CategoryCard from "@/components/category-card"

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

export default function Categories() {
  return (
    <div className="page-viewport hide-scrollbar">
      <div className="container">
        <div className="py-12 space-y-6">
          <div className="w-full">
            <span className="font-canela text-sand-12 text-[32px] leading-[38px] font-medium">
              All categories
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 lg:gap-6">
            {categories.map((category, index) => (
              <CategoryCard key={index}{...category} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}