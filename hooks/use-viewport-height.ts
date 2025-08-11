import { useState, useEffect } from 'react';

export function useViewportHeight() {
  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    const updateHeight = () => {
      // Use visual viewport API for more accurate height
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
      } else {
        setViewportHeight(window.innerHeight);
      }
    };

    // Initial height
    updateHeight();

    // Listen for viewport changes
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateHeight);
    } else {
      window.addEventListener('resize', updateHeight);
      window.addEventListener('orientationchange', updateHeight);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateHeight);
      } else {
        window.removeEventListener('resize', updateHeight);
        window.removeEventListener('orientationchange', updateHeight);
      }
    };
  }, []);

  return viewportHeight;
} 