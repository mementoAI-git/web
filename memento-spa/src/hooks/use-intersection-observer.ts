import { useEffect, useState, type RefObject } from "react";

interface IntersectionObserverOptions {
  threshold?: number | number[];
  rootMargin?: string;
  root?: Element | Document | null;
}

const DEFAULT_OPTIONS: IntersectionObserverOptions = {
  threshold: 0.1,
  rootMargin: "0px",
  root: null,
};

export default function useIntersectionObserver(
  elementRef: RefObject<Element>,
  options: IntersectionObserverOptions = {},
): boolean {
  const { threshold, rootMargin, root } = { ...DEFAULT_OPTIONS, ...options };
  const [isIntersecting, setIntersecting] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIntersecting(entry.isIntersecting);
      },
      { threshold, rootMargin, root },
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [elementRef, threshold, rootMargin, root]);

  return isIntersecting;
}
