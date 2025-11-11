import {
  Children,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface SliderProps {
  children: ReactNode | ReactNode[];
  showArrows?: boolean;
  showIndicators?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  className?: string;
  slideClassName?: string;
  indicatorClassName?: string;
  arrowClassName?: string;
}

export default function Slider({
  children: rawChildren,
  showArrows = false,
  showIndicators = true,
  autoPlay = false,
  autoPlayInterval = 3000,
  className = "",
  slideClassName = "",
  indicatorClassName = "",
  arrowClassName = "",
}: SliderProps) {
  const children = useMemo(() => Children.toArray(rawChildren), [rawChildren]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const totalSlides = children.length;

  const scrollToSlide = useCallback((index: number) => {
    if (!scrollContainerRef.current) return;
    isScrollingRef.current = true;
    const container = scrollContainerRef.current;
    const slideWidth = container.clientWidth;
    container.scrollTo({
      left: slideWidth * index,
      behavior: "smooth",
    });
  }, []);

  const nextSlide = useCallback(() => {
    const next = (currentSlide + 1) % totalSlides;
    setCurrentSlide(next);
    scrollToSlide(next);
  }, [currentSlide, totalSlides, scrollToSlide]);

  const prevSlide = useCallback(() => {
    const prev = (currentSlide - 1 + totalSlides) % totalSlides;
    setCurrentSlide(prev);
    scrollToSlide(prev);
  }, [currentSlide, totalSlides, scrollToSlide]);

  const goToSlide = useCallback(
    (index: number) => {
      setCurrentSlide(index);
      scrollToSlide(index);
    },
    [scrollToSlide],
  );

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const slideWidth = container.clientWidth;
      const currentIndex = Math.round(container.scrollLeft / slideWidth);
      setCurrentSlide(currentIndex);
    };

    const handleScrollEnd = () => {
      isScrollingRef.current = false;
      const slideWidth = container.clientWidth;
      const currentIndex = Math.round(container.scrollLeft / slideWidth);
      setCurrentSlide(currentIndex);
    };

    container.addEventListener("scroll", handleScroll);
    container.addEventListener("scrollend", handleScrollEnd);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      container.removeEventListener("scrollend", handleScrollEnd);
    };
  }, []);

  const handleStart = useCallback((clientX: number) => {
    if (!scrollContainerRef.current) return;
    isScrollingRef.current = true;
    startXRef.current = clientX - scrollContainerRef.current.offsetLeft;
    scrollLeftRef.current = scrollContainerRef.current.scrollLeft;
  }, []);

  const handleMove = useCallback((clientX: number) => {
    if (!isScrollingRef.current || !scrollContainerRef.current) return;
    const x = clientX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeftRef.current - walk;
  }, []);

  const handleEnd = useCallback(() => {
    setTimeout(() => {
      isScrollingRef.current = false;
      if (!scrollContainerRef.current) return;
      const container = scrollContainerRef.current;
      const slideWidth = container.clientWidth;
      const currentIndex = Math.round(container.scrollLeft / slideWidth);
      setCurrentSlide(currentIndex);
    }, 100);
  }, []);

  useEffect(() => {
    if (!autoPlay || totalSlides <= 1) return;
    const interval = setInterval(() => {
      if (!isScrollingRef.current) {
        nextSlide();
      }
    }, autoPlayInterval);
    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, totalSlides, nextSlide]);

  if (!totalSlides) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative overflow-hidden rounded-2xl">
        <div
          ref={scrollContainerRef}
          className="hide-scrollbar flex snap-x snap-mandatory items-stretch gap-4 overflow-x-scroll scroll-smooth"
          style={{ WebkitOverflowScrolling: "touch" }}
          onMouseDown={(event) => handleStart(event.clientX)}
          onMouseMove={(event) => handleMove(event.clientX)}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={(event) => handleStart(event.touches[0].clientX)}
          onTouchMove={(event) => handleMove(event.touches[0].clientX)}
          onTouchEnd={handleEnd}
        >
          {children.map((child, index) => (
            <div
              key={index}
              className={`w-full shrink-0 snap-start ${slideClassName}`}
            >
              {child}
            </div>
          ))}
        </div>

        {showArrows && totalSlides > 1 && (
          <>
            <button
              onClick={prevSlide}
              className={`absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-gray-800 shadow-lg transition-all duration-200 hover:scale-110 hover:bg-white ${arrowClassName}`}
              type="button"
            >
              <svg
                className="size-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={nextSlide}
              className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-gray-800 shadow-lg transition-all duration-200 hover:scale-110 hover:bg-white ${arrowClassName}`}
              type="button"
            >
              <svg
                className="size-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        )}
      </div>

      {showIndicators && totalSlides > 1 && (
        <div className={`mt-4 flex justify-center gap-2 ${indicatorClassName}`}>
          {children.map((_, index) => (
            <button
              key={`indicator-${index}`}
              onClick={() => goToSlide(index)}
              className={`size-3 cursor-pointer rounded-full transition-all duration-200 ${index === currentSlide
                ? "scale-110 bg-sand-8"
                : "bg-sand-4 hover:bg-sand-6"
                }`}
              type="button"
            />
          ))}
        </div>
      )}
    </div>
  );
}
