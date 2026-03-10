import careerImage from "@/assets/image/image-6.png"
import { cn } from "@/utility";
import { Link } from "react-router-dom";

interface ITopicProps {
  title: string
  className?: string
  tag?: string
  image?: string
  onClick?: () => void
  id?: string // Add ID prop for navigation
}

export default function Topic({
  title,
  image = null,
  tag = "Question",
  className = "",
  onClick,
  id
}: ITopicProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const containerClassName = cn("border border-sand-4 space-y-6 rounded-2xl w-fit h-[250px] max-w-[240px] sm:max-w-[270px] p-3 flex-shrink-0 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl hover:shadow-sand-4/20 hover:-translate-y-1 cursor-pointer block", className)

  const content = (
    <>
      <div className="h-30 w-[220px] relative rounded-lg overflow-hidden">
        <div className="absolute top-2 left-2 rounded-full bg-gray-50 w-fit max-w-[90%] py-0.5 px-2 border border-gray-200">
          <span className="font-inter block capitalize font-medium text-xs text-gray-700 truncate">{tag}</span>
        </div>
        <img alt="" width={120} height={120} className="size-full object-cover transition-transform duration-300 ease-in-out hover:scale-110" src={image || careerImage} />
      </div>
      <div className="w-[220px]">
        <span className="font-georgia text-base text-sand-12 font-light w-full block">{title}</span>
      </div>
    </>
  );

  // If we have an ID and no custom onClick, use Link with the same styling
  if (id && !onClick) {
    return (
      <Link
        to={`/chat/reply/${id}`}
        className={containerClassName}
      >
        {content}
      </Link>
    );
  }

  // Otherwise, use regular div with onClick
  return (
    <div
      className={containerClassName}
      onClick={handleClick}
    >
      {content}
    </div>
  );
}

export function TopicSkeleton() {
  return (
    <div className="border border-sand-4 space-y-6 rounded-2xl w-full max-w-[270px] p-6 flex-shrink-0 animate-pulse">
      <div className="h-30 relative rounded-lg overflow-hidden bg-sand-3">
        <div className="absolute top-2 left-2 rounded-full bg-sand-4 px-2 border border-sand-4">
          <div className="h-3 w-16 bg-sand-4 rounded" />
        </div>
      </div>
      <div>
        <div className="h-5 w-full bg-sand-3 rounded mb-2" />
        <div className="h-5 w-3/4 bg-sand-3 rounded" />
      </div>
    </div>
  )
}
