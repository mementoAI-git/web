import careerImage from "@/assets/image/image-6.png";
import { cn } from "@/utility";
import { Link } from "react-router-dom";

interface TopicProps {
  title: string;
  className?: string;
  tag?: string;
  image?: string | null;
  onClick?: () => void;
  id?: string;
}

export default function Topic({
  title,
  image = null,
  tag = "Question",
  className = "",
  onClick,
  id,
}: TopicProps) {
  const handleClick = () => {
    onClick?.();
  };

  const containerClassName = cn(
    "block w-full max-w-[240px] snap-start space-y-6 rounded-2xl border border-sand-4 p-3 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:scale-105 hover:shadow-xl hover:shadow-sand-4/20 sm:max-w-[270px] sm:p-6",
    className,
  );

  const content = (
    <>
      <div className="h-30 relative overflow-hidden rounded-lg">
        <div className="absolute left-2 top-2 max-w-[90%] rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5">
          <span className="block truncate font-inter text-xs font-medium text-gray-700 capitalize">
            {tag}
          </span>
        </div>
        <img
          alt={title}
          width={120}
          height={120}
          className="size-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-110"
          src={image ?? careerImage}
        />
      </div>
      <div>
        <span className="font-georgia text-sand-12 md:text-xl">{title}</span>
      </div>
    </>
  );

  if (id && !onClick) {
    return (
      <Link to={`/chat/reply/${id}`} className={containerClassName}>
        {content}
      </Link>
    );
  }

  return (
    <div className={containerClassName} onClick={handleClick} role="button" tabIndex={0}>
      {content}
    </div>
  );
}

export function TopicSkeleton() {
  return (
    <div className="w-full max-w-[270px] flex-shrink-0 space-y-6 rounded-2xl border border-sand-4 p-6">
      <div className="h-30 relative overflow-hidden rounded-lg bg-sand-3">
        <div className="absolute left-2 top-2 rounded-full border border-sand-4 bg-sand-4 px-2">
          <div className="h-3 w-16 rounded bg-sand-4" />
        </div>
      </div>
      <div>
        <div className="mb-2 h-5 w-full rounded bg-sand-3" />
        <div className="h-5 w-3/4 rounded bg-sand-3" />
      </div>
    </div>
  );
}

