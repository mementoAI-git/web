import { useEffect, useRef } from "react";

export default function useClickAway<T extends HTMLElement>(cb: () => void) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        cb();
      }
    }

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [cb]);

  return ref;
}


