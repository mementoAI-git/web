"use client"

import { ReactNode, useState } from "react"

interface SliderProps {
  children: ReactNode[]
  showArrows?: boolean
  showIndicators?: boolean
  autoPlay?: boolean
  autoPlayInterval?: number
  className?: string
  slideClassName?: string
  indicatorClassName?: string
  arrowClassName?: string
}

export default function Slider({
  children,
  showArrows = true,
  showIndicators = true,
  autoPlay = false,
  autoPlayInterval = 3000,
  className = "",
  slideClassName = "",
  indicatorClassName = "",
  arrowClassName = ""
}: SliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0)

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % children.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + children.length) % children.length)
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  // Auto-play functionality
  useState(() => {
    if (autoPlay && children.length > 1) {
      const interval = setInterval(() => {
        nextSlide()
      }, autoPlayInterval)

      return () => clearInterval(interval)
    }
  })

  if (!children || children.length === 0) {
    return null
  }

  return (
    <div className={`relative ${className}`}>
      {/* Slides Container */}
      <div className="relative overflow-hidden rounded-2xl">
        <div
          className="flex transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {children.map((child, index) => (
            <div key={index} className={`w-full flex-shrink-0 ${slideClassName}`}>
              {child}
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        {showArrows && children.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className={`absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110 ${arrowClassName}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={nextSlide}
              className={`absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110 ${arrowClassName}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Slide Indicators */}
      {showIndicators && children.length > 1 && (
        <div className={`flex justify-center mt-4 gap-2 ${indicatorClassName}`}>
          {children.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-200 cursor-pointer ${index === currentSlide
                  ? 'bg-sand-8 scale-110'
                  : 'bg-sand-4 hover:bg-sand-6'
                }`}
            />
          ))}
        </div>
      )}
    </div>
  )
} 