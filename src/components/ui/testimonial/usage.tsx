import {
  CardTestimonial,
  TestimonialAuthor,
  TestimonialQuote,
  TestimonialRating,
} from "./index";
import { QuoteIcon } from "lucide-react";
import type { TestimonialData } from "./testimonial-grid-demo";

interface CardTestimonialDemoProps {
  testimonial: TestimonialData;
}

export const CardTestimonialDemo = ({ testimonial }: CardTestimonialDemoProps) => {
  return (
    <CardTestimonial
      testimonialQuote={testimonial.quote}
      testimonialRating={testimonial.rating}
      testimonialAuthor={{
        authorName: testimonial.name,
        avatarUrl: testimonial.avatarUrl,
        description: testimonial.profession,
      }}
      variant="glass"
      padding="lg"
      className="w-full h-full shadow-md justify-evenly flex flex-col"
      role="article"
      aria-labelledby={`card-${testimonial.id}-title`}
      aria-describedby={`card-${testimonial.id}-content`}
    >
      <div className="flex flex-col gap-4 flex-1">
        <TestimonialRating className="text-yellow-400 self-start" />
        <div className="relative text-lg flex flex-1 flex-col justify-center">
          <sup>
            <QuoteIcon className="size-6 fill-muted-foreground/20 stroke-none" />
          </sup>
          <TestimonialQuote
            className="my-2"
            id={`card-${testimonial.id}-content`}
          >
            {testimonial.quote}
          </TestimonialQuote>
          <sup className="self-end">
            <QuoteIcon className="size-6 fill-muted-foreground/20 stroke-none" />
          </sup>
        </div>
      </div>

      <TestimonialAuthor
        className="flex self-end items-center gap-4 pt-4 border-t border-slate-100"
        id={`card-${testimonial.id}-title`}
      />
    </CardTestimonial>
  );
};

export default CardTestimonialDemo;