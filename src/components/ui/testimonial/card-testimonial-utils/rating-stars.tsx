import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const starSizes = {
  sm: "size-3",
  md: "size-4",
  lg: "size-5",
};

export const RatingStars = ({
  rating,
  maxRating = 5,
  size = "md",
  className,
}: RatingStarsProps) => {
  const stars = Array.from({ length: maxRating }, (_, i) => i + 1);

  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      aria-label={`${rating} out of ${maxRating} stars`}
    >
      {stars.map((star) => (
        <Star
          key={star}
          className={cn(
            starSizes[size],
            star <= rating
              ? "text-yellow-400 fill-yellow-400"
              : "text-slate-300 fill-transparent stroke-slate-300"
          )}
        />
      ))}
    </div>
  );
};