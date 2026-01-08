import { useState, useEffect } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";

export default function CreateDream() {
  const [, params] = useRoute("/edit/:id");
  const dreamId = params?.id ? parseInt(params.id) : undefined;
  const isEditing = !!dreamId;

  const [, setLocation] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [dreamDate, setDreamDate] = useState(new Date().toISOString().split("T")[0]);
  const [imageUrl, setImageUrl] = useState("");
  const [imageKey, setImageKey] = useState("");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const { data: dreamData, isLoading: dreamLoading } = trpc.dream.getById.useQuery(
    { dreamId: dreamId! },
    { enabled: isEditing }
  );

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  useEffect(() => {
    if (dreamData?.dream && isEditing) {
      setTitle(dreamData.dream.title);
      setContent(dreamData.dream.content);
      setDreamDate(new Date(dreamData.dream.dreamDate).toISOString().split("T")[0]);
      setImageUrl(dreamData.dream.imageUrl || "");
      setImageKey(dreamData.dream.imageKey || "");
    }
  }, [dreamData, isEditing]);

  const createMutation = trpc.dream.create.useMutation({
    onSuccess: (data) => {
      toast.success("梦境创建成功");
      setLocation(`/dream/${data.dreamId}`);
    },
    onError: () => {
      toast.error("创建失败，请重试");
    },
  });

  const updateMutation = trpc.dream.update.useMutation({
    onSuccess: () => {
      toast.success("梦境更新成功");
      setLocation(`/dream/${dreamId}`);
    },
    onError: () => {
      toast.error("更新失败，请重试");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast.error("请填写标题和内容");
      return;
    }

    const dreamDateTimestamp = new Date(dreamDate).getTime();

    if (isEditing && dreamId) {
      updateMutation.mutate({
        dreamId,
        title,
        content,
        dreamDate: dreamDateTimestamp,
        imageUrl: imageUrl || undefined,
        imageKey: imageKey || undefined,
      });
    } else {
      createMutation.mutate({
        title,
        content,
        dreamDate: dreamDateTimestamp,
        imageUrl: imageUrl || undefined,
        imageKey: imageKey || undefined,
      });
    }
  };

  const generateImageMutation = trpc.ai.generateImage.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        setImageUrl(data.url);
      }
      toast.success("配图生成成功");
      setIsGeneratingImage(false);
    },
    onError: () => {
      toast.error("配图生成失败，请重试");
      setIsGeneratingImage(false);
    },
  });

  const handleGenerateImage = () => {
    if (!title.trim() || !content.trim()) {
      toast.error("请先填写标题和内容");
      return;
    }
    setIsGeneratingImage(true);
    generateImageMutation.mutate({ title, content });
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (authLoading || (isEditing && dreamLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 md:py-12">
      <div className="container max-w-3xl">
        <Button variant="ghost" size="sm" className="mb-6" onClick={() => window.location.href = isEditing ? `/dream/${dreamId}` : '/'}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>

        <h1 className="mb-8">{isEditing ? "编辑梦境" : "记录梦境"}</h1>

        <Card className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="dreamDate">梦境日期</Label>
              <Input
                id="dreamDate"
                type="date"
                value={dreamDate}
                onChange={(e) => setDreamDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="title">标题</Label>
              <Input
                id="title"
                placeholder="给你的梦境起个标题..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-2"
                maxLength={255}
              />
            </div>

            <div>
              <Label htmlFor="content">梦境内容</Label>
              <Textarea
                id="content"
                placeholder="描述你的梦境..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="mt-2 min-h-64"
              />
              <p className="text-xs text-muted-foreground mt-2">
                详细描述你的梦境，包括场景、人物、情节等细节
              </p>
            </div>

            {imageUrl && (
              <div>
                <Label>配图预览</Label>
                <div className="mt-2 rounded-lg overflow-hidden border border-border">
                  <img src={imageUrl} alt="Dream" className="w-full" />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isEditing ? "保存中..." : "创建中..."}
                  </>
                ) : (
                  <>{isEditing ? "保存更改" : "发布梦境"}</>
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                disabled={isGeneratingImage || isSubmitting}
                className="gap-2"
                onClick={handleGenerateImage}
              >
                {isGeneratingImage ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    AI配图
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
