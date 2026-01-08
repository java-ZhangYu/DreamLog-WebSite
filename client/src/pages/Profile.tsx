import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Calendar, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { useEffect } from "react";

export default function Profile() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setLocation("/");
    }
  }, [loading, isAuthenticated, setLocation]);

  const { data, isLoading } = trpc.dream.myDreams.useQuery({ limit: 20, offset: 0 });

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const dreams = data?.dreams || [];

  return (
    <div className="min-h-screen py-8 md:py-12">
      <div className="container max-w-6xl">
        <div className="mb-12">
          <h1 className="mb-4">个人主页</h1>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-light">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <h2 className="text-xl font-medium">{user?.name || "用户"}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="mb-6">我的梦境 ({dreams.length})</h2>
          {dreams.length === 0 ? (
        <Card className="p-12 text-center">
              <p className="text-muted-foreground mb-4">还没有记录梅境</p>
              <Button onClick={() => window.location.href = '/create'}>开始记录</Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {dream.content}
                        </p>
                      </div>
                    </div>
                  <div className="px-6 pb-4 flex items-center gap-4 border-t border-border pt-4">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Heart className="h-4 w-4" />
                      <span>{dream.likesCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MessageCircle className="h-4 w-4" />
                      <span>{dream.commentsCount}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
