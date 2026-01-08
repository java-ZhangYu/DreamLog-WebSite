import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `user${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("like.toggle", () => {
  it("likes a dream successfully", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a dream
    const created = await caller.dream.create({
      title: "测试点赞梦境",
      content: "用于测试点赞功能",
      dreamDate: Date.now(),
    });

    // Like the dream
    const result = await caller.like.toggle({
      dreamId: created.dreamId,
    });

    expect(result.liked).toBe(true);

    // Verify like count increased
    const dream = await caller.dream.getById({
      dreamId: created.dreamId,
    });
    expect(dream.dream.likesCount).toBe(1);
  });

  it("unlikes a dream successfully", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a dream
    const created = await caller.dream.create({
      title: "测试取消点赞梦境",
      content: "用于测试取消点赞功能",
      dreamDate: Date.now(),
    });

    // Like the dream
    await caller.like.toggle({ dreamId: created.dreamId });

    // Unlike the dream
    const result = await caller.like.toggle({
      dreamId: created.dreamId,
    });

    expect(result.liked).toBe(false);

    // Verify like count decreased
    const dream = await caller.dream.getById({
      dreamId: created.dreamId,
    });
    expect(dream.dream.likesCount).toBe(0);
  });
});

describe("favorite.toggle", () => {
  it("favorites a dream successfully", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a dream
    const created = await caller.dream.create({
      title: "测试收藏梦境",
      content: "用于测试收藏功能",
      dreamDate: Date.now(),
    });

    // Favorite the dream
    const result = await caller.favorite.toggle({
      dreamId: created.dreamId,
    });

    expect(result.favorited).toBe(true);

    // Verify favorite count increased
    const dream = await caller.dream.getById({
      dreamId: created.dreamId,
    });
    expect(dream.dream.favoritesCount).toBe(1);
  });

  it("unfavorites a dream successfully", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a dream
    const created = await caller.dream.create({
      title: "测试取消收藏梦境",
      content: "用于测试取消收藏功能",
      dreamDate: Date.now(),
    });

    // Favorite the dream
    await caller.favorite.toggle({ dreamId: created.dreamId });

    // Unfavorite the dream
    const result = await caller.favorite.toggle({
      dreamId: created.dreamId,
    });

    expect(result.favorited).toBe(false);

    // Verify favorite count decreased
    const dream = await caller.dream.getById({
      dreamId: created.dreamId,
    });
    expect(dream.dream.favoritesCount).toBe(0);
  });

  it("retrieves user favorites", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a dream
    const created = await caller.dream.create({
      title: "收藏列表测试梦境",
      content: "用于测试收藏列表",
      dreamDate: Date.now(),
    });

    // Favorite the dream
    await caller.favorite.toggle({ dreamId: created.dreamId });

    // Get favorites
    const result = await caller.favorite.myFavorites({
      limit: 10,
      offset: 0,
    });

    expect(result).toHaveProperty("dreams");
    expect(Array.isArray(result.dreams)).toBe(true);
    expect(result.dreams.length).toBeGreaterThan(0);
  });
});

describe("comment.create", () => {
  it("creates a comment successfully", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a dream
    const created = await caller.dream.create({
      title: "测试评论梦境",
      content: "用于测试评论功能",
      dreamDate: Date.now(),
    });

    // Create a comment
    const result = await caller.comment.create({
      dreamId: created.dreamId,
      content: "这是一条测试评论",
    });

    expect(result).toHaveProperty("commentId");
    expect(result.commentId).toBeGreaterThan(0);

    // Verify comment count increased
    const dream = await caller.dream.getById({
      dreamId: created.dreamId,
    });
    expect(dream.dream.commentsCount).toBe(1);
  });

  it("retrieves comments for a dream", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a dream
    const created = await caller.dream.create({
      title: "评论列表测试梦境",
      content: "用于测试评论列表",
      dreamDate: Date.now(),
    });

    // Create a comment
    await caller.comment.create({
      dreamId: created.dreamId,
      content: "第一条评论",
    });

    // Get comments
    const result = await caller.comment.list({
      dreamId: created.dreamId,
      limit: 10,
      offset: 0,
    });

    expect(result).toHaveProperty("comments");
    expect(Array.isArray(result.comments)).toBe(true);
    expect(result.comments.length).toBe(1);
    expect(result.comments[0]?.content).toBe("第一条评论");
  });
});

describe("comment.delete", () => {
  it("deletes own comment successfully", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a dream
    const created = await caller.dream.create({
      title: "删除评论测试梦境",
      content: "用于测试删除评论",
      dreamDate: Date.now(),
    });

    // Create a comment
    const comment = await caller.comment.create({
      dreamId: created.dreamId,
      content: "待删除的评论",
    });

    // Delete the comment
    const result = await caller.comment.delete({
      commentId: comment.commentId,
    });

    expect(result.success).toBe(true);

    // Verify comment count decreased
    const dream = await caller.dream.getById({
      dreamId: created.dreamId,
    });
    expect(dream.dream.commentsCount).toBe(0);
  });

  it("prevents deleting another user's comment", async () => {
    const ctx1 = createAuthContext(1);
    const caller1 = appRouter.createCaller(ctx1);

    // User 1 creates a dream
    const created = await caller1.dream.create({
      title: "权限测试梦境",
      content: "用于测试评论权限",
      dreamDate: Date.now(),
    });

    // User 1 creates a comment
    const comment = await caller1.comment.create({
      dreamId: created.dreamId,
      content: "用户1的评论",
    });

    // User 2 tries to delete it
    const ctx2 = createAuthContext(2);
    const caller2 = appRouter.createCaller(ctx2);

    await expect(
      caller2.comment.delete({ commentId: comment.commentId })
    ).rejects.toThrow();
  });
});
