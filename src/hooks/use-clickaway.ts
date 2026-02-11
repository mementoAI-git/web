// import { useEffect, useRef } from "react";

// export default function useClickAway(cb: Function) {
//   const ref = useRef<any>(null);

//   const handleClickOutside = (event: MouseEvent) => {
//     if (ref.current && !ref.current.contains(event.target)) {
//       cb();
//     }
//   };

//   useEffect(() => {
//     document.addEventListener("click", handleClickOutside);

//     return () => {
//       document.removeEventListener("click", handleClickOutside);
//     };
//   }, [cb, handleClickOutside]);

//   return ref;
// }

import { useEffect, useRef } from "react";

export default function useClickAway(cb: () => void) {
  const ref = useRef<HTMLDivElement>(null);

  // Store cb in a ref to avoid re-running effect when cb changes
  const callbackRef = useRef(cb);

  useEffect(() => {
    callbackRef.current = cb;
  }, [cb]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callbackRef.current();
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  return ref;
}
