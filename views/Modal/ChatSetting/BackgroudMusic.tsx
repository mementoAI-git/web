import Switch from "@/components/Switch";
import musicImage from "@/public/image/music.png"
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

function Slider() {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [volume, setVolume] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    updateVolume(e);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    updateVolume(e);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const updateVolume = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (!sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setVolume(Math.round(percentage));
  }, []);

  // Add event listeners for mouse move and up
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleSliderClick = useCallback((e: React.MouseEvent) => {
    updateVolume(e);
  }, [updateVolume]);

  return (
    <div
      ref={sliderRef}
      className="w-full bg-sand-3 h-[6px] rounded-full cursor-pointer relative"
      onClick={handleSliderClick}
    >
      <div
        className="bg-sand-7 h-full rounded-full relative transition-all duration-150"
        style={{ width: `${volume}%` }}
      >
        <div
          className="bg-white cursor-pointer absolute right-0 top-1/2 -translate-y-1/2 size-4 rounded-full border-2 border-sand-8 hover:scale-110 transition-transform duration-150"
          onMouseDown={handleMouseDown}
          style={{
            right: '-8px'
          }}
        />
      </div>
    </div>
  )
}

export default function BackgroundMusic() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sand-12 font-canela text-xl">Background Music</span>
        <Switch />
      </div>
      <Slider />
      <div className="grid grid-cols-2 gap-3">
        {
          ["Moonlight", "Sea Waves", "Arkansas", "A love for life"].map((title, i) => (
            <div key={i} className="border border-[#EAECF0] py-2.5 px-3 rounded-xl flex gap-3 items-center" >
              <Image src={musicImage} width={32} height={32} className="size-8" alt="Music" />
              <div className="flex flex-col">
                <span className="text-sand-12 font-inter font-medium text-sm">{title}</span>
                <span className="font-inter text-xs text-[#667085]"> Tune {i + 1}</span>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  )
}