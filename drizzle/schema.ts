import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, bigint, index } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Dreams table - stores user dream entries
 */
export const dreams = mysqlTable("dreams", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  dreamDate: timestamp("dreamDate").notNull(), // The date when the dream occurred
  imageUrl: text("imageUrl"), // AI-generated or user-uploaded image
  imageKey: text("imageKey"), // S3 key for the image
  likesCount: int("likesCount").default(0).notNull(),
  commentsCount: int("commentsCount").default(0).notNull(),
  favoritesCount: int("favoritesCount").default(0).notNull(),
  averageRating: int("averageRating").default(0).notNull(),
  ratingCount: int("ratingCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
  createdAtIdx: index("createdAt_idx").on(table.createdAt),
}));

export type Dream = typeof dreams.$inferSelect;
export type InsertDream = typeof dreams.$inferInsert;

/**
 * Likes table - tracks user likes on dreams
 */
export const likes = mysqlTable("likes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  dreamId: int("dreamId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userDreamIdx: index("user_dream_idx").on(table.userId, table.dreamId),
  dreamIdIdx: index("dreamId_idx").on(table.dreamId),
}));

export type Like = typeof likes.$inferSelect;
export type InsertLike = typeof likes.$inferInsert;

/**
 * Comments table - stores comments on dreams
 */
export const comments = mysqlTable("comments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  dreamId: int("dreamId").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  dreamIdIdx: index("dreamId_idx").on(table.dreamId),
  userIdIdx: index("userId_idx").on(table.userId),
}));

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

/**
 * Favorites table - tracks user favorites on dreams
 */
export const favorites = mysqlTable("favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  dreamId: int("dreamId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userDreamIdx: index("user_dream_idx").on(table.userId, table.dreamId),
  dreamIdIdx: index("dreamId_idx").on(table.dreamId),
}));

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;

/**
 * Dream analyses table - stores AI-generated dream interpretations
 */
export const dreamAnalyses = mysqlTable("dreamAnalyses", {
  id: int("id").autoincrement().primaryKey(),
  dreamId: int("dreamId").notNull().unique(),
  symbolism: text("symbolism"), // Symbolic meanings
  emotionalAnalysis: text("emotionalAnalysis"), // Emotional interpretation
  psychologicalInsight: text("psychologicalInsight"), // Psychological perspective
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  dreamIdIdx: index("dreamId_idx").on(table.dreamId),
}));

export type DreamAnalysis = typeof dreamAnalyses.$inferSelect;
export type InsertDreamAnalysis = typeof dreamAnalyses.$inferInsert;

/**
 * Ratings table - stores user ratings on dreams
 */
export const ratings = mysqlTable("ratings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  dreamId: int("dreamId").notNull(),
  rating: int("rating").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userDreamIdx: index("user_dream_rating_idx").on(table.userId, table.dreamId),
  dreamIdIdx: index("dreamId_rating_idx").on(table.dreamId),
}));

export type Rating = typeof ratings.$inferSelect;
export type InsertRating = typeof ratings.$inferInsert;
