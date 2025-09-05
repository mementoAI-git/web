import { useEffect, useState, RefObject } from "react";

interface IntersectionObserverOptions {
  threshold?: number | number[];
  rootMargin?: string;
  root?: Element | Document | null;
}

const DEFAULT_OPTIONS: IntersectionObserverOptions = {
  threshold: 0.1,
  rootMargin: '0px',
  root: null
};

// This updated hook takes a ref object and returns a boolean indicating if the element is intersecting.
export const useIntersectionObserver = (
  elementRef: RefObject<Element>,
  options: IntersectionObserverOptions = {}
): boolean => {
  const {
    threshold,
    rootMargin,
    root
  } = { ...DEFAULT_OPTIONS, ...options };

  const [isIntersecting, setIntersecting] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Update the state based on the intersection status
        setIntersecting(entry.isIntersecting);
      },
      {
        threshold,
        rootMargin,
        root
      }
    );

    // Start observing the element provided via the ref
    observer.observe(element);

    // Cleanup: stop observing when the component unmounts
    return () => {
      observer.unobserve(element);
    };
  }, [elementRef, threshold, rootMargin, root]); // Dependencies array now includes the ref

  return isIntersecting;
};

export default useIntersectionObserver;