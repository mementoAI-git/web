"use client"
import { cn } from "@/utility";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";

interface ISegment {
  label: string
  key: string
}

interface ISegmentController {
  segments: ISegment[]
  initial: string
}

export default function SegmentedController({ segments, initial = segments[0].key }: ISegmentController) {
  const [active, setActive] = useState(initial);
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const tabRefs = useRef([]);

  useEffect(() => {
    const idx = segments.findIndex(seg => seg.key === active);
    const node = tabRefs.current[idx];
    if (node) {
      setIndicatorStyle({
        left: node.offsetLeft,
        width: node.offsetWidth,
      });
    }
  }, [active]);

  return (
    <div className="relative w-fit">
      <div className="bg-[#F2F4F7] flex font-geist text-sm p-2 rounded-sm w-fit relative">
        {segments.map((segment, idx) => (
          <Link
            key={idx}
            href={segment.key}
            // @ts-ignore
            ref={el => (tabRefs.current[idx] = el)}
            className={cn("h-8 shrink-0 whitespace-nowrap px-6 items-center text-center flex rounded-sm cursor-pointer transition-colors relative z-10 font-normal text-[#667085]", { "font-bold  text-black": active === segment.key })}
            onClick={() => setActive(segment.key)}
          >
            {segment.label}
          </Link>
        ))}
        <span
          className="absolute bottom-2 left-0 h-8 bg-white rounded-sm shadow transition-all duration-300 z-0"
          style={{
            ...indicatorStyle,
            transition: "left 0.3s cubic-bezier(.4,0,.2,1), width 0.3s cubic-bezier(.4,0,.2,1)",
          }}
        />
      </div>
    </div>
  )
}