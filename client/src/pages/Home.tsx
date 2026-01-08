import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, MessageCircle, BookMarked, Calendar } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { useState } from "react";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [offset, setOffset] = useState(0);
  const limit = 12;

  const { data, isLoading } = trpc.dream.list.useQuery({ limit, offset });
  const utils = trpc.useUtils();

  const likeMutation = trpc.like.toggle.useMutation({
    onMutate: async ({ dreamId }) => {
      await utils.dream.list.cancel();
      const previousData = utils.dream.list.getData({ limit, offset });

      utils.dream.list.setData({ limit, offset }, (old) => {
        if (!old) return old;
        return {
          dreams: old.dreams.map((dream) =>
            dream.id === dreamId
              ? {
                  ...dream,
                  isLiked: !dream.isLiked,
                  likesCount: dream.isLiked ? dream.likesCount - 1 : dream.likesCount + 1,
                }
              : dream
          ),
        };
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        utils.dream.list.setData({ limit, offset }, context.previousData);
      }
    },
  });

  const favoriteMutation = trpc.favorite.toggle.useMutation({
    onMutate: async ({ dreamId }) => {
      await utils.dream.list.cancel();
      const previousData = utils.dream.list.getData({ limit, offset });

      utils.dream.list.setData({ limit, offset }, (old) => {
        if (!old) return old;
        return {
          dreams: old.dreams.map((dream) =>
            dream.id === dreamId
              ? {
                  ...dream,
                  isFavorited: !dream.isFavorited,
                  favoritesCount: dream.isFavorited ? dream.favoritesCount - 1 : dream.favoritesCount + 1,
                }
              : dream
          ),
        };
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        utils.dream.list.setData({ limit, offset }, context.previousData);
      }
    },
  });

  const handleLike = (dreamId: number) => {
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }
    likeMutation.mutate({ dreamId });
  };

  const handleFavorite = (dreamId: number) => {
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }
    favoriteMutation.mutate({ dreamId });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  const dreams = data?.dreams || [];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="border-b border-border py-16 md:py-24">
        <div className="container max-w-4xl text-center">
          <h1 className="mb-6">梦境日志</h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8">
            记录你的梦境，探索潜意识的奥秘。在这里，每一个梦都是一段独特的故事，
            每一次分享都是一次心灵的对话。
          </p>
          {isAuthenticated ? (
            <Button size="lg" className="text-base px-8" onClick={() => window.location.href = '/create'}>
              开始记录
            </Button>
          ) : (
            <Button size="lg" className="text-base px-8" asChild>
              <a href="/api/oauth/login">登录开始</a>
            </Button>
          )}
        </div>
      </section>

      {/* Dreams Grid */}
      <section className="py-12 md:py-16">
        <div className="container">
          {dreams.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">还没有梦境分享，成为第一个记录者吧</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {dreams.map((dream) => (
                  <Card key={dream.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="block cursor-pointer" onClick={() => window.location.href = `/dream/${dream.id}`}>
                        {dream.imageUrl && (
                          <div className="aspect-[4/3] overflow-hidden bg-muted">
                            <img
                              src={dream.imageUrl}
                              alt={dream.title}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}
                        <div className="p-6">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                            <Calendar className="h-3 w-3" />
                            <time>
                              {format(new Date(dream.dreamDate), "yyyy年M月d日", { locale: zhCN })}
                            </time>
                          </div>
                          <h3 className="mb-3 line-clamp-2">{dream.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                            {dream.content}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <span>by</span>
                            <span className="font-medium">{dream.author?.name || "匹名"}</span>
                          </div>
                        </div>
                      </div>
                    <div className="px-6 pb-4 flex items-center gap-4 border-t border-border pt-4">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleLike(dream.id);
                        }}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Heart
                          className={`h-4 w-4 ${dream.isLiked ? "fill-current text-red-500" : ""}`}
                        />
                        <span>{dream.likesCount}</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          window.location.href = `/dream/${dream.id}#comments`;
                        }}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>{dream.commentsCount}</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleFavorite(dream.id);
                        }}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors ml-auto"
                      >
                        <BookMarked
                          className={`h-4 w-4 ${dream.isFavorited ? "fill-current text-accent" : ""}`}
                        />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>

              {dreams.length >= limit && (
                <div className="mt-12 text-center">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setOffset(offset + limit)}
                  >
                    加载更多
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
