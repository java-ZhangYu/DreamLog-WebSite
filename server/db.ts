import { eq, desc, and, sql, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  dreams, 
  likes, 
  comments, 
  favorites, 
  dreamAnalyses,
  ratings,
  InsertDream,
  InsertLike,
  InsertComment,
  InsertFavorite,
  InsertDreamAnalysis,
  InsertRating
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ==================== User Functions ====================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUsersByIds(userIds: number[]) {
  const db = await getDb();
  if (!db || userIds.length === 0) return [];
  
  return db.select().from(users).where(inArray(users.id, userIds));
}

// ==================== Dream Functions ====================

export async function createDream(dream: InsertDream) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(dreams).values(dream);
  return result[0].insertId;
}

export async function getDreamById(dreamId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(dreams).where(eq(dreams.id, dreamId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getDreamsByUserId(userId: number, limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(dreams)
    .where(eq(dreams.userId, userId))
    .orderBy(desc(dreams.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getAllDreams(limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(dreams)
    .orderBy(desc(dreams.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function updateDream(dreamId: number, updates: Partial<InsertDream>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(dreams).set(updates).where(eq(dreams.id, dreamId));
}

export async function deleteDream(dreamId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(dreams).where(eq(dreams.id, dreamId));
}

export async function incrementDreamLikes(dreamId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(dreams)
    .set({ likesCount: sql`${dreams.likesCount} + 1` })
    .where(eq(dreams.id, dreamId));
}

export async function decrementDreamLikes(dreamId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(dreams)
    .set({ likesCount: sql`GREATEST(${dreams.likesCount} - 1, 0)` })
    .where(eq(dreams.id, dreamId));
}

export async function incrementDreamComments(dreamId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(dreams)
    .set({ commentsCount: sql`${dreams.commentsCount} + 1` })
    .where(eq(dreams.id, dreamId));
}

export async function decrementDreamComments(dreamId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(dreams)
    .set({ commentsCount: sql`GREATEST(${dreams.commentsCount} - 1, 0)` })
    .where(eq(dreams.id, dreamId));
}

export async function incrementDreamFavorites(dreamId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(dreams)
    .set({ favoritesCount: sql`${dreams.favoritesCount} + 1` })
    .where(eq(dreams.id, dreamId));
}

export async function decrementDreamFavorites(dreamId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(dreams)
    .set({ favoritesCount: sql`GREATEST(${dreams.favoritesCount} - 1, 0)` })
    .where(eq(dreams.id, dreamId));
}

// ==================== Like Functions ====================

export async function createLike(like: InsertLike) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(likes).values(like);
}

export async function deleteLike(userId: number, dreamId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(likes).where(
    and(eq(likes.userId, userId), eq(likes.dreamId, dreamId))
  );
}

export async function getLikeByUserAndDream(userId: number, dreamId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select()
    .from(likes)
    .where(and(eq(likes.userId, userId), eq(likes.dreamId, dreamId)))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function getLikesByDreamIds(userId: number, dreamIds: number[]) {
  const db = await getDb();
  if (!db || dreamIds.length === 0) return [];
  
  return db.select()
    .from(likes)
    .where(and(eq(likes.userId, userId), inArray(likes.dreamId, dreamIds)));
}

// ==================== Comment Functions ====================

export async function createComment(comment: InsertComment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(comments).values(comment);
  return result[0].insertId;
}

export async function getCommentsByDreamId(dreamId: number, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(comments)
    .where(eq(comments.dreamId, dreamId))
    .orderBy(desc(comments.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function deleteComment(commentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(comments).where(eq(comments.id, commentId));
}

export async function getCommentById(commentId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(comments).where(eq(comments.id, commentId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ==================== Favorite Functions ====================

export async function createFavorite(favorite: InsertFavorite) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(favorites).values(favorite);
}

export async function deleteFavorite(userId: number, dreamId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(favorites).where(
    and(eq(favorites.userId, userId), eq(favorites.dreamId, dreamId))
  );
}

export async function getFavoriteByUserAndDream(userId: number, dreamId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select()
    .from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.dreamId, dreamId)))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function getFavoritesByUserId(userId: number, limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(favorites)
    .where(eq(favorites.userId, userId))
    .orderBy(desc(favorites.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getFavoritesByDreamIds(userId: number, dreamIds: number[]) {
  const db = await getDb();
  if (!db || dreamIds.length === 0) return [];
  
  return db.select()
    .from(favorites)
    .where(and(eq(favorites.userId, userId), inArray(favorites.dreamId, dreamIds)));
}

// ==================== Dream Analysis Functions ====================

export async function createDreamAnalysis(analysis: InsertDreamAnalysis) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(dreamAnalyses).values(analysis);
}

export async function getDreamAnalysisByDreamId(dreamId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select()
    .from(dreamAnalyses)
    .where(eq(dreamAnalyses.dreamId, dreamId))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

// ==================== Rating Functions ====================

export async function createOrUpdateRating(userId: number, dreamId: number, rating: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await db.select()
    .from(ratings)
    .where(and(eq(ratings.userId, userId), eq(ratings.dreamId, dreamId)))
    .limit(1);
  
  if (existing.length > 0) {
    await db.update(ratings)
      .set({ rating, updatedAt: new Date() })
      .where(and(eq(ratings.userId, userId), eq(ratings.dreamId, dreamId)));
  } else {
    await db.insert(ratings).values({ userId, dreamId, rating });
  }
  
  await updateDreamRatingStats(dreamId);
}

export async function updateDreamRatingStats(dreamId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const ratingResults = await db.select()
    .from(ratings)
    .where(eq(ratings.dreamId, dreamId));
  
  if (ratingResults.length === 0) {
    await db.update(dreams)
      .set({ averageRating: 0, ratingCount: 0 })
      .where(eq(dreams.id, dreamId));
    return;
  }
  
  const totalRating = ratingResults.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = Math.round((totalRating / ratingResults.length) * 10);
  
  await db.update(dreams)
    .set({ averageRating, ratingCount: ratingResults.length })
    .where(eq(dreams.id, dreamId));
}

export async function getUserRatingForDream(userId: number, dreamId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select()
    .from(ratings)
    .where(and(eq(ratings.userId, userId), eq(ratings.dreamId, dreamId)))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function getTopRatedDreams(limit: number = 10, timeRange?: 'week' | 'month') {
  const db = await getDb();
  if (!db) return [];
  
  let whereClause: any = undefined;
  
  if (timeRange) {
    const now = new Date();
    const daysAgo = timeRange === 'week' ? 7 : 30;
    const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    whereClause = sql`${dreams.createdAt} >= ${startDate}`;
  }
  
  const query = db.select()
    .from(dreams)
    .orderBy(desc(dreams.averageRating), desc(dreams.ratingCount))
    .limit(limit);
  
  if (whereClause) {
    return query.where(whereClause);
  }
  
  return query;
}
