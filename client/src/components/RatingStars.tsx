import { Star } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface RatingStarsProps {
  dreamId: number;
  averageRating: number;
  ratingCount: number;
  interactive?: boolean;
  onRatingChange?: () => void;
}

export function RatingStars({
  dreamId,
  averageRating,
  ratingCount,
  interactive = false,
  onRatingChange,
}: RatingStarsProps) {
  const [hoverRating, setHoverRating] = useState(0);
  const { data: userRatingData } = trpc.rating.getUserRating.useQuery(
    { dreamId },
    { enabled: interactive }
  );
  const [userRating, setUserRating] = useState(userRatingData?.rating ?? 0);

  const rateMutation = trpc.rating.rate.useMutation({
    onSuccess: () => {
      toast.success("评分已保存");
      onRatingChange?.();
    },
    onError: () => {
      toast.error("评分失败，请重试");
    },
  });

  const displayRating = averageRating / 10;
  const fullStars = Math.floor(displayRating);
  const hasHalfStar = displayRating % 1 >= 0.5;

  const handleRate = (rating: number) => {
    setUserRating(rating);
    rateMutation.mutate({ dreamId, rating });
  };

  if (!interactive) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-4 w-4 ${
                star <= fullStars
                  ? "fill-yellow-400 text-yellow-400"
                  : star === fullStars + 1 && hasHalfStar
                  ? "fill-yellow-200 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          ))}
        </div>
        <span className="text-sm text-muted-foreground">
          {displayRating.toFixed(1)} ({ratingCount})
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleRate(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              disabled={rateMutation.isPending}
              className="transition-transform hover:scale-110 disabled:opacity-50"
            >
              <Star
                className={`h-6 w-6 ${
                  star <= (hoverRating || userRating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            </button>
          ))}
        </div>
        {userRating > 0 && (
          <span className="text-sm text-muted-foreground">
            你的评分: {userRating} 星
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>
          {displayRating.toFixed(1)} 星
        </span>
        <span>({ratingCount} 个评分)</span>
      </div>
    </div>
  );
}
