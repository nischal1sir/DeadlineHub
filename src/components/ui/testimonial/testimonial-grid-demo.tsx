import {
  CardTestimonial,
  TestimonialAuthor,
  TestimonialQuote,
  TestimonialRating,
} from "./index";
import { QuoteIcon } from "lucide-react";

export interface TestimonialData {
  id: string;
  name: string;
  profession: string;
  rating: number;
  quote: string;
  avatarUrl?: string;
}

export const TESTIMONIALS: TestimonialData[] = [
  {
    id: "testimonial-1",
    name: "Mukesh Khatiwada",
    profession: "Product Lead, TechFlow",
    rating: 5,
    quote:
      "DeadlineHUB cut our missed deadlines by 80%. The visual progress tracking keeps everyone accountable without micromanaging.",
    avatarUrl: undefined,
  },
  {
    id: "testimonial-2",
    name: "Saujal Karki",
    profession: "Senior Developer",
    rating: 5,
    quote:
      "Finally a project tool that doesn't feel like a chore. We onboarded the whole team in under 30 minutes.",
    avatarUrl: undefined,
  },
  {
    id: "testimonial-3",
    name: "Elgems Rai",
    profession: "Startup Founder",
    rating: 5,
    quote:
      "The real-time sync is a game changer. I can see exactly what's blocking our release without asking in Slack.",
    avatarUrl: undefined,
  },
  {
    id: "testimonial-4",
    name: "Priya Sharma",
    profession: "Engineering Manager, ScaleUp",
    rating: 5,
    quote:
      "The deadline prediction feature saved our launch. We knew exactly when we'd ship weeks in advance.",
    avatarUrl: undefined,
  },
  {
    id: "testimonial-5",
    name: "Rajesh Thapa",
    profession: "CTO, InnovateLab",
    rating: 5,
    quote:
      "Best investment for our dev team. Subtasks and dependencies finally work the way we think.",
    avatarUrl: undefined,
  },
  {
    id: "testimonial-6",
    name: "Anita Gurung",
    profession: "Project Coordinator, CreativeCo",
    rating: 5,
    quote:
      "Client reporting used to take hours. Now it's one click. Our stakeholders love the transparency.",
    avatarUrl: undefined,
  },
  {
    id: "testimonial-7",
    name: "Deepak Bista",
    profession: "VP Engineering, GrowthTech",
    rating: 5,
    quote:
      "The workload balancing prevented burnout during our busiest quarter. Team velocity improved 40%.",
    avatarUrl: undefined,
  },
];

interface TestimonialCardProps {
  testimonial: TestimonialData;
}

export const TestimonialCard = ({ testimonial }: TestimonialCardProps) => {
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
      padding="md"
      className="h-full flex flex-col justify-between"
      role="article"
      aria-labelledby={`card-${testimonial.id}-title`}
      aria-describedby={`card-${testimonial.id}-content`}
    >
      <div className="flex flex-col gap-4">
        <TestimonialRating className="text-yellow-400 self-start" />
        <div className="relative flex flex-1 flex-col justify-center">
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

export const TestimonialGrid = ({
  testimonials = TESTIMONIALS,
}: { testimonials?: TestimonialData[] } = {}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {testimonials.map((testimonial) => (
        <TestimonialCard key={testimonial.id} testimonial={testimonial} />
      ))}
    </div>
  );
};

export default TestimonialGrid;