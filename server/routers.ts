import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Dream routes
  dream: router({
    // Create a new dream
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1).max(255),
        content: z.string().min(1),
        dreamDate: z.number(), // Unix timestamp
        imageUrl: z.string().optional(),
        imageKey: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const dreamId = await db.createDream({
          userId: ctx.user.id,
          title: input.title,
          content: input.content,
          dreamDate: new Date(input.dreamDate),
          imageUrl: input.imageUrl ?? null,
          imageKey: input.imageKey ?? null,
        });
        return { dreamId };
      }),

    // Get dream by ID with author info
    getById: publicProcedure
      .input(z.object({ dreamId: z.number() }))
      .query(async ({ input }) => {
        const dream = await db.getDreamById(input.dreamId);
        if (!dream) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Dream not found' });
        }
        const author = await db.getUserById(dream.userId);
        return { dream, author };
      }),

    // Get all dreams with pagination
    list: publicProcedure
      .input(z.object({
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      }))
      .query(async ({ input, ctx }) => {
        const dreamsList = await db.getAllDreams(input.limit, input.offset);
        const userIds = Array.from(new Set(dreamsList.map(d => d.userId)));
        const authors = await db.getUsersByIds(userIds);
        const authorMap = new Map(authors.map(a => [a.id, a]));
        
        // Get like/favorite status if user is authenticated
        let likedDreamIds = new Set<number>();
        let favoritedDreamIds = new Set<number>();
        
        if (ctx.user) {
          const dreamIds = dreamsList.map(d => d.id);
          const userLikes = await db.getLikesByDreamIds(ctx.user.id, dreamIds);
          const userFavorites = await db.getFavoritesByDreamIds(ctx.user.id, dreamIds);
          likedDreamIds = new Set(userLikes.map(l => l.dreamId));
          favoritedDreamIds = new Set(userFavorites.map(f => f.dreamId));
        }
        
        const dreams = dreamsList.map(dream => ({
          ...dream,
          author: authorMap.get(dream.userId),
          isLiked: likedDreamIds.has(dream.id),
          isFavorited: favoritedDreamIds.has(dream.id),
        }));
        
        return { dreams };
      }),

    // Get user's own dreams
    myDreams: protectedProcedure
      .input(z.object({
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      }))
      .query(async ({ ctx, input }) => {
        const dreams = await db.getDreamsByUserId(ctx.user.id, input.limit, input.offset);
        return { dreams };
      }),

    // Update dream
    update: protectedProcedure
      .input(z.object({
        dreamId: z.number(),
        title: z.string().min(1).max(255).optional(),
        content: z.string().min(1).optional(),
        dreamDate: z.number().optional(),
        imageUrl: z.string().optional(),
        imageKey: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const dream = await db.getDreamById(input.dreamId);
        if (!dream) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Dream not found' });
        }
        if (dream.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        }
        
        const updates: any = {};
        if (input.title !== undefined) updates.title = input.title;
        if (input.content !== undefined) updates.content = input.content;
        if (input.dreamDate !== undefined) updates.dreamDate = new Date(input.dreamDate);
        if (input.imageUrl !== undefined) updates.imageUrl = input.imageUrl;
        if (input.imageKey !== undefined) updates.imageKey = input.imageKey;
        
        await db.updateDream(input.dreamId, updates);
        return { success: true };
      }),

    // Delete dream
    delete: protectedProcedure
      .input(z.object({ dreamId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const dream = await db.getDreamById(input.dreamId);
        if (!dream) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Dream not found' });
        }
        if (dream.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        }
        
        await db.deleteDream(input.dreamId);
        return { success: true };
      }),
  }),

  // Like routes
  like: router({
    // Toggle like on a dream
    toggle: protectedProcedure
      .input(z.object({ dreamId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const existing = await db.getLikeByUserAndDream(ctx.user.id, input.dreamId);
        
        if (existing) {
          await db.deleteLike(ctx.user.id, input.dreamId);
          await db.decrementDreamLikes(input.dreamId);
          return { liked: false };
        } else {
          await db.createLike({ userId: ctx.user.id, dreamId: input.dreamId });
          await db.incrementDreamLikes(input.dreamId);
          return { liked: true };
        }
      }),

    // Check if user liked a dream
    check: protectedProcedure
      .input(z.object({ dreamId: z.number() }))
      .query(async ({ ctx, input }) => {
        const like = await db.getLikeByUserAndDream(ctx.user.id, input.dreamId);
        return { liked: !!like };
      }),
  }),

  // Comment routes
  comment: router({
    // Create a comment
    create: protectedProcedure
      .input(z.object({
        dreamId: z.number(),
        content: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const commentId = await db.createComment({
          userId: ctx.user.id,
          dreamId: input.dreamId,
          content: input.content,
        });
        await db.incrementDreamComments(input.dreamId);
        return { commentId };
      }),

    // Get comments for a dream
    list: publicProcedure
      .input(z.object({
        dreamId: z.number(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }))
      .query(async ({ input }) => {
        const commentsList = await db.getCommentsByDreamId(input.dreamId, input.limit, input.offset);
        const userIds = Array.from(new Set(commentsList.map(c => c.userId)));
        const authors = await db.getUsersByIds(userIds);
        const authorMap = new Map(authors.map(a => [a.id, a]));
        
        const comments = commentsList.map(comment => ({
          ...comment,
          author: authorMap.get(comment.userId),
        }));
        
        return { comments };
      }),

    // Delete a comment
    delete: protectedProcedure
      .input(z.object({ commentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const comment = await db.getCommentById(input.commentId);
        if (!comment) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Comment not found' });
        }
        if (comment.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        }
        
        await db.deleteComment(input.commentId);
        await db.decrementDreamComments(comment.dreamId);
        return { success: true };
      }),
  }),

  // Favorite routes
  favorite: router({
    // Toggle favorite on a dream
    toggle: protectedProcedure
      .input(z.object({ dreamId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const existing = await db.getFavoriteByUserAndDream(ctx.user.id, input.dreamId);
        
        if (existing) {
          await db.deleteFavorite(ctx.user.id, input.dreamId);
          await db.decrementDreamFavorites(input.dreamId);
          return { favorited: false };
        } else {
          await db.createFavorite({ userId: ctx.user.id, dreamId: input.dreamId });
          await db.incrementDreamFavorites(input.dreamId);
          return { favorited: true };
        }
      }),

    // Get user's favorited dreams
    myFavorites: protectedProcedure
      .input(z.object({
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      }))
      .query(async ({ ctx, input }) => {
        const favoritesList = await db.getFavoritesByUserId(ctx.user.id, input.limit, input.offset);
        const dreamIds = favoritesList.map(f => f.dreamId);
        
        if (dreamIds.length === 0) {
          return { dreams: [] };
        }
        
        const db_instance = await db.getDb();
        if (!db_instance) return { dreams: [] };
        
        const { dreams: dreamsTable } = await import("../drizzle/schema");
        const { inArray } = await import("drizzle-orm");
        
        const dreamsList = await db_instance.select()
          .from(dreamsTable)
          .where(inArray(dreamsTable.id, dreamIds));
        
        const userIds = Array.from(new Set(dreamsList.map(d => d.userId)));
        const authors = await db.getUsersByIds(userIds);
        const authorMap = new Map(authors.map(a => [a.id, a]));
        
        const dreams = dreamsList.map(dream => ({
          ...dream,
          author: authorMap.get(dream.userId),
          isFavorited: true,
        }));
        
        return { dreams };
      }),
  }),

  // Dream analysis routes
  analysis: router({
    // Get analysis for a dream
    get: publicProcedure
      .input(z.object({ dreamId: z.number() }))
      .query(async ({ input }) => {
        const analysis = await db.getDreamAnalysisByDreamId(input.dreamId);
        return { analysis };
      }),

    // Generate AI analysis for a dream
    generate: protectedProcedure
      .input(z.object({ dreamId: z.number() }))
      .mutation(async ({ input }) => {
        const dream = await db.getDreamById(input.dreamId);
        if (!dream) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Dream not found' });
        }

        // Check if analysis already exists
        const existing = await db.getDreamAnalysisByDreamId(input.dreamId);
        if (existing) {
          return { analysis: existing };
        }

        // Generate analysis
        const { analyzeDream } = await import('./ai');
        const analysisResult = await analyzeDream(`${dream.title}\n\n${dream.content}`);

        // Save to database
        await db.createDreamAnalysis({
          dreamId: input.dreamId,
          symbolism: analysisResult.symbolism,
          emotionalAnalysis: analysisResult.emotionalAnalysis,
          psychologicalInsight: analysisResult.psychologicalInsight,
        });

        const analysis = await db.getDreamAnalysisByDreamId(input.dreamId);
        return { analysis };
      }),
  }),

  // AI image generation
  ai: router({
    // Generate image for dream
    generateImage: protectedProcedure
      .input(z.object({
        title: z.string(),
        content: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { generateDreamImage } = await import('./ai');
        const result = await generateDreamImage(input.title, input.content);
        return result;
      }),
  }),


  rating: router({
    rate: protectedProcedure
      .input(z.object({
        dreamId: z.number(),
        rating: z.number().min(1).max(5),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createOrUpdateRating(ctx.user.id, input.dreamId, input.rating);
        return { success: true };
      }),

    getUserRating: protectedProcedure
      .input(z.object({ dreamId: z.number() }))
      .query(async ({ ctx, input }) => {
        const rating = await db.getUserRatingForDream(ctx.user.id, input.dreamId);
        return { rating: rating?.rating ?? null };
      }),
  }),

  leaderboard: router({
    topRated: publicProcedure
      .input(z.object({
        limit: z.number().default(10),
        timeRange: z.enum(['all', 'week', 'month']).default('all'),
      }))
      .query(async ({ input }) => {
        const timeRange = input.timeRange === 'all' ? undefined : (input.timeRange as 'week' | 'month');
        const dreams = await db.getTopRatedDreams(input.limit, timeRange);
        
        const dreamsWithAuthors = await Promise.all(
          dreams.map(async (dream) => {
            const author = await db.getUserById(dream.userId);
            return { dream, author };
          })
        );
        
        return { dreams: dreamsWithAuthors };
      }),
  }),
});

export type AppRouter = typeof appRouter;
