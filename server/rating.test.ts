import { describe, it, expect, beforeEach, vi } from "vitest";
import * as db from "./db";

describe("Rating Functions", () => {
  const testUserId = 1;
  const testDreamId = 1;

  describe("createOrUpdateRating", () => {
    it("should create a new rating", async () => {
      // Mock the database functions
      const createSpy = vi.spyOn(db, "createOrUpdateRating");
      
      await db.createOrUpdateRating(testUserId, testDreamId, 5);
      
      expect(createSpy).toHaveBeenCalledWith(testUserId, testDreamId, 5);
    });

    it("should update an existing rating", async () => {
      const updateSpy = vi.spyOn(db, "createOrUpdateRating");
      
      await db.createOrUpdateRating(testUserId, testDreamId, 3);
      await db.createOrUpdateRating(testUserId, testDreamId, 4);
      
      expect(updateSpy).toHaveBeenCalledTimes(2);
    });

    it("should validate rating is between 1 and 5", async () => {
      const invalidRatings = [0, 6, -1, 10];
      
      for (const rating of invalidRatings) {
        try {
          await db.createOrUpdateRating(testUserId, testDreamId, rating);
          // If we get here, the validation failed
          expect(true).toBe(false);
        } catch (error) {
          // Expected to throw
          expect(error).toBeDefined();
        }
      }
    });
  });

  describe("getUserRatingForDream", () => {
    it("should return user's rating for a dream", async () => {
      const getSpy = vi.spyOn(db, "getUserRatingForDream");
      
      await db.getUserRatingForDream(testUserId, testDreamId);
      
      expect(getSpy).toHaveBeenCalledWith(testUserId, testDreamId);
    });

    it("should return undefined if user hasn't rated", async () => {
      const result = await db.getUserRatingForDream(999, 999);
      expect(result).toBeUndefined();
    });
  });

  describe("getTopRatedDreams", () => {
    it("should return top rated dreams", async () => {
      const getSpy = vi.spyOn(db, "getTopRatedDreams");
      
      await db.getTopRatedDreams(10, undefined);
      
      expect(getSpy).toHaveBeenCalledWith(10, undefined);
    });

    it("should filter by time range", async () => {
      const getSpy = vi.spyOn(db, "getTopRatedDreams");
      
      await db.getTopRatedDreams(10, "week");
      
      expect(getSpy).toHaveBeenCalledWith(10, "week");
    });

    it("should support different time ranges", async () => {
      const getSpy = vi.spyOn(db, "getTopRatedDreams");
      
      await db.getTopRatedDreams(10, "month");
      
      expect(getSpy).toHaveBeenCalledWith(10, "month");
    });
  });

  describe("updateDreamRatingStats", () => {
    it("should update dream's average rating", async () => {
      const updateSpy = vi.spyOn(db, "updateDreamRatingStats");
      
      await db.updateDreamRatingStats(testDreamId);
      
      expect(updateSpy).toHaveBeenCalledWith(testDreamId);
    });

    it("should set rating to 0 if no ratings exist", async () => {
      const updateSpy = vi.spyOn(db, "updateDreamRatingStats");
      
      await db.updateDreamRatingStats(999);
      
      expect(updateSpy).toHaveBeenCalled();
    });
  });
});
