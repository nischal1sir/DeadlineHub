import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TestimonialCard } from "./testimonial/testimonial-grid-demo";
import type { TestimonialData } from "./testimonial/testimonial-grid-demo";

interface TestimonialCarouselProps {
  testimonials: TestimonialData[];
  autoRotate?: boolean;
  autoRotateInterval?: number;
}

export const TestimonialCarousel: React.FC<TestimonialCarouselProps> = ({
  testimonials,
  autoRotate = true,
  autoRotateInterval = 5000,
}) => {
  const totalItems = testimonials.length;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(3);
  const [isAnimating, setIsAnimating] = useState(false);

  const maxIndex = Math.max(0, totalItems - itemsPerView);

  const updateItemsPerView = useCallback(() => {
    const width = window.innerWidth;
    if (width >= 1024) {
      setItemsPerView(3);
    } else if (width >= 768) {
      setItemsPerView(2);
    } else {
      setItemsPerView(1);
    }
  }, []);

  useEffect(() => {
    updateItemsPerView();
    window.addEventListener('resize', updateItemsPerView);
    return () => window.removeEventListener('resize', updateItemsPerView);
  }, [updateItemsPerView]);

  useEffect(() => {
    setCurrentIndex((prev) => Math.min(prev, maxIndex));
  }, [maxIndex]);

  const animate = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 400);
  }, []);

  const goToNext = useCallback(() => {
    if (isAnimating) return;
    animate();
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [isAnimating, maxIndex, animate]);

  const goToPrev = useCallback(() => {
    if (isAnimating) return;
    animate();
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  }, [isAnimating, maxIndex, animate]);

  const goToIndex = useCallback((index: number) => {
    if (isAnimating || index === currentIndex) return;
    animate();
    setCurrentIndex(index);
  }, [isAnimating, currentIndex, animate]);

  useEffect(() => {
    if (!autoRotate) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, autoRotateInterval);
    return () => clearInterval(interval);
  }, [autoRotate, autoRotateInterval, maxIndex]);

  const getCardWidth = () => {
    if (itemsPerView === 3) return 'sm:w-[calc(33.333%-0.67rem)]';
    if (itemsPerView === 2) return 'md:w-[calc(50%-0.5rem)]';
    return '';
  };

  const visibleTestimonials = testimonials.slice(currentIndex, currentIndex + itemsPerView);
  const pageCount = Math.max(1, totalItems - itemsPerView + 1);

  return (
    <div className="relative">
      <div
        key={currentIndex}
        className="flex flex-wrap gap-4 transition-all duration-500 ease-out"
      >
        {visibleTestimonials.map((testimonial, i) => (
          <div
            key={testimonial.id}
            className={`w-full ${getCardWidth()} animate-fade-in`}
            style={{ animationDelay: `${i * 120}ms` }}
          >
            <TestimonialCard testimonial={testimonial} />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-3 mt-6">
        <button
          onClick={goToPrev}
          disabled={isAnimating}
          className="w-10 h-10 rounded-full bg-white border border-slate-200 hover:border-brand/50 hover:bg-brand/5 text-brand flex items-center justify-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          aria-label="Previous testimonials"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex gap-1.5">
          {Array.from({ length: pageCount }, (_, i) => (
            <button
              key={i}
              onClick={() => goToIndex(i)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === currentIndex
                  ? 'bg-brand w-6'
                  : 'bg-slate-300 hover:bg-brand/50'
              }`}
              aria-label={`Go to testimonial page ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={goToNext}
          disabled={isAnimating}
          className="w-10 h-10 rounded-full bg-white border border-slate-200 hover:border-brand/50 hover:bg-brand/5 text-brand flex items-center justify-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          aria-label="Next testimonials"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};