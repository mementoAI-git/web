import { isEmpty } from "@/utility";
import { useEffect, useRef, useState } from "react";

export default function useTypingEffect(text: string, speed = 15) {
  const [index, setIndex] = useState(0)
  const [typedText, setTypedText] = useState(null)
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isEmpty(text)) return;
    clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setIndex(prev => {
        console.log(prev)
        if (prev > text.length) {
          clearInterval(intervalRef.current);
          setTypedText(text);
        }

        if (prev < text.length) {
          return prev + 1
        } else {
          return prev
        }
      })
    }, speed);

    return () => clearInterval(intervalRef.current);
  }, [speed, text]);

  return isEmpty(typedText) ? text.slice(0, index) : typedText;
}