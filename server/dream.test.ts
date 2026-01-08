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

describe("dream.create", () => {
  it("creates a new dream with valid data", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.dream.create({
      title: "测试梦境",
      content: "这是一个测试梦境的内容，包含了详细的梦境描述。",
      dreamDate: Date.now(),
    });

    expect(result).toHaveProperty("dreamId");
    expect(typeof result.dreamId).toBe("number");
    expect(result.dreamId).toBeGreaterThan(0);
  });

  it("creates a dream with image", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.dream.create({
      title: "带配图的梦境",
      content: "这个梦境有配图",
      dreamDate: Date.now(),
      imageUrl: "https://example.com/image.jpg",
      imageKey: "dreams/test-image.jpg",
    });

    expect(result).toHaveProperty("dreamId");
    expect(result.dreamId).toBeGreaterThan(0);
  });
});

describe("dream.list", () => {
  it("returns dreams list with pagination", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a test dream first
    await caller.dream.create({
      title: "列表测试梦境",
      content: "用于测试列表功能的梦境",
      dreamDate: Date.now(),
    });

    const result = await caller.dream.list({
      limit: 10,
      offset: 0,
    });

    expect(result).toHaveProperty("dreams");
    expect(Array.isArray(result.dreams)).toBe(true);
  });
});

describe("dream.getById", () => {
  it("retrieves a dream by ID", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a dream first
    const created = await caller.dream.create({
      title: "获取测试梦境",
      content: "用于测试获取功能的梦境",
      dreamDate: Date.now(),
    });

    const result = await caller.dream.getById({
      dreamId: created.dreamId,
    });

    expect(result).toHaveProperty("dream");
    expect(result).toHaveProperty("author");
    expect(result.dream.id).toBe(created.dreamId);
    expect(result.dream.title).toBe("获取测试梦境");
  });
});

describe("dream.update", () => {
  it("updates own dream successfully", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a dream
    const created = await caller.dream.create({
      title: "原始标题",
      content: "原始内容",
      dreamDate: Date.now(),
    });

    // Update the dream
    await caller.dream.update({
      dreamId: created.dreamId,
      title: "更新后的标题",
      content: "更新后的内容",
    });

    // Verify the update
    const result = await caller.dream.getById({
      dreamId: created.dreamId,
    });

    expect(result.dream.title).toBe("更新后的标题");
    expect(result.dream.content).toBe("更新后的内容");
  });

  it("prevents updating another user's dream", async () => {
    const ctx1 = createAuthContext(1);
    const caller1 = appRouter.createCaller(ctx1);

    // User 1 creates a dream
    const created = await caller1.dream.create({
      title: "用户1的梦境",
      content: "这是用户1的梦境",
      dreamDate: Date.now(),
    });

    // User 2 tries to update it
    const ctx2 = createAuthContext(2);
    const caller2 = appRouter.createCaller(ctx2);

    await expect(
      caller2.dream.update({
        dreamId: created.dreamId,
        title: "恶意更新",
      })
    ).rejects.toThrow();
  });
});

describe("dream.delete", () => {
  it("deletes own dream successfully", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a dream
    const created = await caller.dream.create({
      title: "待删除的梦境",
      content: "这个梦境将被删除",
      dreamDate: Date.now(),
    });

    // Delete the dream
    const result = await caller.dream.delete({
      dreamId: created.dreamId,
    });

    expect(result.success).toBe(true);

    // Verify it's deleted
    await expect(
      caller.dream.getById({ dreamId: created.dreamId })
    ).rejects.toThrow();
  });

  it("prevents deleting another user's dream", async () => {
    const ctx1 = createAuthContext(1);
    const caller1 = appRouter.createCaller(ctx1);

    // User 1 creates a dream
    const created = await caller1.dream.create({
      title: "用户1的梦境",
      content: "这是用户1的梦境",
      dreamDate: Date.now(),
    });

    // User 2 tries to delete it
    const ctx2 = createAuthContext(2);
    const caller2 = appRouter.createCaller(ctx2);

    await expect(
      caller2.dream.delete({ dreamId: created.dreamId })
    ).rejects.toThrow();
  });
});
