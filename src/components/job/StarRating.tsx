"use client";

import { Star } from "lucide-react";

type StarRatingProps = {
  value: number;
  size?: number;
  showValue?: boolean;
  reviews?: number;
  className?: string;
};

export default function StarRating({ value, size = 14, showValue = true, reviews, className = "" }: StarRatingProps) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="inline-flex">
        {[1, 2, 3, 4, 5].map((i) => {
          const filled = i <= Math.floor(rounded);
          const half = !filled && i - 0.5 === rounded;
          return (
            <Star
              key={i}
              size={size}
              className={filled || half ? "fill-amber-400 text-amber-400" : "text-slate-300"}
              strokeWidth={1.5}
            />
          );
        })}
      </span>
      {showValue && <span className="text-sm font-semibold text-foreground">{value.toFixed(1)}</span>}
      {reviews != null && <span className="text-xs text-muted-foreground">({reviews.toLocaleString()})</span>}
    </span>
  );
}
