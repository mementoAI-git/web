import { useEffect, useState, useRef } from 'react';

interface UseViewportPositionReturn {
  isInTopHalf: boolean;
  ref: React.RefObject<HTMLElement>;
}

export function useViewportPosition(): UseViewportPositionReturn {
  const [isInTopHalf, setIsInTopHalf] = useState<boolean>(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const checkPosition = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const elementCenter = rect.top + rect.height / 2;
        const viewportCenter = viewportHeight / 2;

        setIsInTopHalf(elementCenter < viewportCenter);
      }
    };

    // Check position on mount and resize
    checkPosition();
    window.addEventListener('resize', checkPosition);
    window.addEventListener('scroll', checkPosition);

    return () => {
      window.removeEventListener('resize', checkPosition);
      window.removeEventListener('scroll', checkPosition);
    };
  }, []);

  return { isInTopHalf, ref };
} 