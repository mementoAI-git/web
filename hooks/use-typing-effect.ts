import { isEmpty } from "@/utility";
import { useEffect, useRef, useState } from "react";

export default function useTypingEffect(text: string, speed = 15) {
  const [index, setIndex] = useState(0)
  const [typedText, setTypedText] = useState("")
  const intervalRef = useRef(null);
  const textRef = useRef(text);

  // Update text reference when text changes
  useEffect(() => {
    textRef.current = text;
  }, [text]);

  useEffect(() => {
    if (isEmpty(text)) {
      setIndex(0);
      setTypedText("");
      return;
    }

    // Reset when text changes
    if (text !== textRef.current) {
      setIndex(0);
      setTypedText("");
    }

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setIndex(prev => {
        if (prev >= text.length) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          setTypedText(text);
          return prev;
        }
        return prev + 1;
      });
    }, speed);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [text, speed]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  return isEmpty(typedText) ? text.slice(0, index) : typedText;
}