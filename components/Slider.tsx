"use client"

import { ReactNode, useState, useRef, useEffect } from "react"

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
  showArrows = false,
  showIndicators = true,
  autoPlay = false,
  autoPlayInterval = 3000,
  className = "",
  slideClassName = "",
  indicatorClassName = "",
  arrowClassName = ""
}: SliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isScrollingRef = useRef(false)
  const startXRef = useRef(0)
  const scrollLeftRef = useRef(0)

  const scrollToSlide = (index: number) => {
    if (scrollContainerRef.current) {
      isScrollingRef.current = true
      const container = scrollContainerRef.current
      const slideWidth = container.clientWidth
      container.scrollTo({
        left: slideWidth * index,
        behavior: 'smooth'
      })
    }
  }

  const nextSlide = () => {
    const next = (currentSlide + 1) % children.length
    setCurrentSlide(next)
    scrollToSlide(next)
  }

  const prevSlide = () => {
    const prev = (currentSlide - 1 + children.length) % children.length
    setCurrentSlide(prev)
    scrollToSlide(prev)
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
    scrollToSlide(index)
  }

  // Update current slide based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current
        const slideWidth = container.clientWidth
        const currentIndex = Math.round(container.scrollLeft / slideWidth)
        setCurrentSlide(currentIndex)
      }
    }

    const handleScrollEnd = () => {
      isScrollingRef.current = false
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current
        const slideWidth = container.clientWidth
        const currentIndex = Math.round(container.scrollLeft / slideWidth)
        setCurrentSlide(currentIndex)
      }
    }

    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      container.addEventListener('scrollend', handleScrollEnd)
      return () => {
        container.removeEventListener('scroll', handleScroll)
        container.removeEventListener('scrollend', handleScrollEnd)
      }
    }
  }, [])

  // Touch/mouse drag handlers
  const handleStart = (clientX: number) => {
    if (scrollContainerRef.current) {
      isScrollingRef.current = true
      startXRef.current = clientX - scrollContainerRef.current.offsetLeft
      scrollLeftRef.current = scrollContainerRef.current.scrollLeft
    }
  }

  const handleMove = (clientX: number) => {
    if (!isScrollingRef.current || !scrollContainerRef.current) return

    const x = clientX - scrollContainerRef.current.offsetLeft
    const walk = (x - startXRef.current) * 2
    scrollContainerRef.current.scrollLeft = scrollLeftRef.current - walk
  }

  const handleEnd = () => {
    setTimeout(() => {
      isScrollingRef.current = false
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current
        const slideWidth = container.clientWidth
        const currentIndex = Math.round(container.scrollLeft / slideWidth)
        setCurrentSlide(currentIndex)
      }
    }, 100)
  }

  // Auto-play functionality
  useEffect(() => {
    if (autoPlay && children.length > 1) {
      const interval = setInterval(() => {
        if (!isScrollingRef.current) {
          nextSlide()
        }
      }, autoPlayInterval)

      return () => clearInterval(interval)
    }
  }, [autoPlay, autoPlayInterval, currentSlide, children.length])

  if (!children || children.length === 0) {
    return null
  }

  return (
    <div className={`relative ${className}`}>
      {/* Slides Container */}
      <div className="relative overflow-hidden rounded-2xl">
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-scroll items-stretch snap-x snap-mandatory scroll-smooth gap-4 hide-scrollbar"
          style={{ WebkitOverflowScrolling: 'touch' }}
          onMouseDown={(e) => handleStart(e.clientX)}
          onMouseMove={(e) => handleMove(e.clientX)}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={(e) => handleStart(e.touches[0].clientX)}
          onTouchMove={(e) => handleMove(e.touches[0].clientX)}
          onTouchEnd={handleEnd}
        >
          {children.map((child, index) => (
            <div key={index} className={`w-full flex-shrink-0 snap-start ${slideClassName}`}>
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