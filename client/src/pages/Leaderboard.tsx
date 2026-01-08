import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RatingStars } from "@/components/RatingStars";
import { Calendar, Star } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

export default function Leaderboard() {
  const [timeRange, setTimeRange] = useState<'all' | 'week' | 'month'>('all');

  const { data, isLoading } = trpc.leaderboard.topRated.useQuery({
    limit: 20,
    timeRange,
  });

  const dreams = data?.dreams || [];

  const timeRangeLabel = {
    all: '全时间',
    week: '本周',
    month: '本月',
  };

  return (
    <div className="min-h-screen py-8 md:py-12">
      <div className="container max-w-6xl">
        <div className="mb-8">
          <h1 className="mb-4">梦境排行榜</h1>
          <p className="text-muted-foreground mb-6">
            发现最受欢迎的梦境，看看其他人都在做什么梦
          </p>

          {/* Time Range Selector */}
          <div className="flex gap-2">
            {(['all', 'week', 'month'] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'outline'}
                onClick={() => setTimeRange(range)}
              >
                {timeRangeLabel[range]}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">加载中...</p>
          </div>
        ) : dreams.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">暂无梦境数据</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {dreams.map((item, index) => (
              <Card
                key={item.dream.id}
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => (window.location.href = `/dream/${item.dream.id}`)}
              >
                <div className="flex items-start gap-4">
                  {/* Rank Badge */}
                  <div className="flex-shrink-0">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                        index === 0
                          ? 'bg-yellow-100 text-yellow-700'
                          : index === 1
                          ? 'bg-gray-100 text-gray-700'
                          : index === 2
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      #{index + 1}
                    </div>
                  </div>

                  {/* Dream Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h3 className="font-serif text-lg font-bold mb-1 line-clamp-2">
                          {item.dream.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                          <Calendar className="h-3 w-3" />
                          <time>
                            {format(new Date(item.dream.dreamDate), 'yyyy年M月d日', {
                              locale: zhCN,
                            })}
                          </time>
                          <span>•</span>
                          <span>by {item.author?.name || '匿名'}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {item.dream.content}
                    </p>

                    {/* Rating */}
                    <div className="flex items-center gap-4">
                      <RatingStars
                        dreamId={item.dream.id}
                        averageRating={item.dream.averageRating}
                        ratingCount={item.dream.ratingCount}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex-shrink-0 text-right">
                    <div className="flex items-center gap-1 text-yellow-500 font-semibold mb-2">
                      <Star className="h-4 w-4 fill-current" />
                      <span>{(item.dream.averageRating / 10).toFixed(1)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {item.dream.ratingCount} 个评分
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
