import { useRoute, useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageCircle, BookMarked, Calendar, ArrowLeft, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { RatingStars } from "@/components/RatingStars";
import { useState } from "react";
import { toast } from "sonner";

export default function DreamDetail() {
  const [, params] = useRoute("/dream/:id");
  const [, setLocation] = useLocation();
  const dreamId = params?.id ? parseInt(params.id) : 0;
  const { user, isAuthenticated } = useAuth();
  const [commentContent, setCommentContent] = useState("");

  const { data, isLoading } = trpc.dream.getById.useQuery({ dreamId });
  const { data: commentsData } = trpc.comment.list.useQuery({ dreamId, limit: 50 });
  const { data: analysisData, refetch: refetchAnalysis } = trpc.analysis.get.useQuery({ dreamId });
  const utils = trpc.useUtils();

  const likeMutation = trpc.like.toggle.useMutation({
    onSuccess: () => {
      utils.dream.getById.invalidate({ dreamId });
    },
  });

  const favoriteMutation = trpc.favorite.toggle.useMutation({
    onSuccess: () => {
      utils.dream.getById.invalidate({ dreamId });
    },
  });

  const commentMutation = trpc.comment.create.useMutation({
    onSuccess: () => {
      setCommentContent("");
      utils.comment.list.invalidate({ dreamId });
      utils.dream.getById.invalidate({ dreamId });
      toast.success("评论发表成功");
    },
    onError: () => {
      toast.error("评论发表失败");
    },
  });

  const deleteCommentMutation = trpc.comment.delete.useMutation({
    onSuccess: () => {
      utils.comment.list.invalidate({ dreamId });
      utils.dream.getById.invalidate({ dreamId });
      toast.success("评论已删除");
    },
  });

  const deleteDreamMutation = trpc.dream.delete.useMutation({
    onSuccess: () => {
      toast.success("梦境已删除");
      setLocation("/");
    },
    onError: () => {
      toast.error("删除失败");
    },
  });

  const generateAnalysisMutation = trpc.analysis.generate.useMutation({
    onSuccess: () => {
      refetchAnalysis();
      toast.success("AI分析生成成功");
    },
    onError: () => {
      toast.error("分析生成失败，请重试");
    },
  });

  const handleSubmitComment = () => {
    if (!isAuthenticated) {
      window.location.href = "/api/oauth/login";
      return;
    }
    if (!commentContent.trim()) {
      toast.error("请输入评论内容");
      return;
    }
    commentMutation.mutate({ dreamId, content: commentContent });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data?.dream) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">梦境不存在</p>
        <Button asChild variant="outline">
          <Link href="/">返回首页</Link>
        </Button>
      </div>
    );
  }

  const { dream, author } = data;
  const comments = commentsData?.comments || [];
  const analysis = analysisData?.analysis;
  const isOwner = user?.id === dream.userId;

  return (
    <div className="min-h-screen py-8 md:py-12">
      <div className="container max-w-4xl">
        <Button variant="ghost" size="sm" className="mb-6" onClick={() => window.location.href = '/'}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>

        {/* Dream Content */}
        <article className="mb-12">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Calendar className="h-4 w-4" />
            <time>{format(new Date(dream.dreamDate), "yyyy年M月d日", { locale: zhCN })}</time>
          </div>

          <h1 className="mb-6">{dream.title}</h1>

          {dream.imageUrl && (
            <div className="mb-8 rounded-lg overflow-hidden">
              <img src={dream.imageUrl} alt={dream.title} className="w-full" />
            </div>
          )}

          <div className="prose prose-lg max-w-none mb-8">
            <p className="whitespace-pre-wrap leading-relaxed">{dream.content}</p>
          </div>

          <div className="flex items-center justify-between border-t border-b border-border py-4 mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    window.location.href = "/api/oauth/login";
                    return;
                  }
                  likeMutation.mutate({ dreamId });
                }}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Heart className={`h-5 w-5 ${dream.likesCount > 0 ? "fill-current text-red-500" : ""}`} />
                <span>{dream.likesCount}</span>
              </button>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MessageCircle className="h-5 w-5" />
                <span>{dream.commentsCount}</span>
              </div>
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    window.location.href = "/api/oauth/login";
                    return;
                  }
                  favoriteMutation.mutate({ dreamId });
                }}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <BookMarked className={`h-5 w-5 ${dream.favoritesCount > 0 ? "fill-current text-accent" : ""}`} />
                <span>{dream.favoritesCount}</span>
              </button>
            </div>

            <div className="text-sm text-muted-foreground">
              by <span className="font-medium">{author?.name || "匿名"}</span>
            </div>
          </div>

          {isOwner && (
            <div className="flex gap-2 mb-8">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/edit/${dream.id}`}>编辑</Link>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (confirm("确定要删除这个梦境吗？")) {
                    deleteDreamMutation.mutate({ dreamId });
                  }
                }}
              >
                删除
              </Button>
            </div>
          )}
        </article>

        {/* AI Analysis */}
        {!analysis && isOwner && (
          <div className="mb-8">
            <Button
              onClick={() => generateAnalysisMutation.mutate({ dreamId })}
              disabled={generateAnalysisMutation.isPending}
              variant="outline"
              className="w-full md:w-auto"
            >
              {generateAnalysisMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  生成中...
                </>
              ) : (
                "生成 AI 梦境解析"
              )}
            </Button>
          </div>
        )}
        {analysis && (
          <Card className="p-6 md:p-8 mb-12">
            <h2 className="mb-6">AI 梦境解析</h2>
            {analysis.symbolism && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">象征意义</h3>
                <p className="text-muted-foreground leading-relaxed">{analysis.symbolism}</p>
              </div>
            )}
            {analysis.emotionalAnalysis && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">情感分析</h3>
                <p className="text-muted-foreground leading-relaxed">{analysis.emotionalAnalysis}</p>
              </div>
            )}
            {analysis.psychologicalInsight && (
              <div>
                <h3 className="text-lg font-medium mb-2">心理学解读</h3>
                <p className="text-muted-foreground leading-relaxed">{analysis.psychologicalInsight}</p>
              </div>
            )}
          </Card>
        )}

        {/* Comments Section */}
        <section id="comments">
          <h2 className="mb-6">评论 ({comments.length})</h2>

          {isAuthenticated ? (
            <Card className="p-4 mb-8">
              <Textarea
                placeholder="分享你的想法..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                className="mb-3 min-h-24"
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmitComment}
                  disabled={commentMutation.isPending || !commentContent.trim()}
                >
                  {commentMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      发表中...
                    </>
                  ) : (
                    "发表评论"
                  )}
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-6 mb-8 text-center">
              <p className="text-muted-foreground mb-4">登录后即可发表评论</p>
              <Button asChild>
                <a href="/api/oauth/login">登录</a>
              </Button>
            </Card>
          )}

          <div className="space-y-4">
            {comments.map((comment) => (
              <Card key={comment.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{comment.author?.name || "匿名"}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(comment.createdAt), "yyyy-MM-dd HH:mm")}
                    </span>
                  </div>
                  {user?.id === comment.userId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm("确定要删除这条评论吗？")) {
                          deleteCommentMutation.mutate({ commentId: comment.id });
                        }
                      }}
                    >
                      删除
                    </Button>
                  )}
                </div>
                <p className="text-sm leading-relaxed">{comment.content}</p>
              </Card>
            ))}

            {comments.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                还没有评论，来发表第一条吧
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
