import { z } from "zod";

/**
 * Normalizes a tag string by trimming, converting to lowercase,
 * and stripping leading "#" or invalid characters.
 */
export function normalizeTag(tag: string): string {
  return tag
    .trim()
    .toLowerCase()
    .replace(/^#+/, "")
    .replace(/[^a-z0-9-_]/g, "");
}

/**
 * Zod schema for single tag validation
 */
export const tagSchema = z
  .string()
  .min(2, "Tag must be at least 2 characters")
  .max(30, "Tag must be at most 30 characters")
  .regex(/^[a-z0-9-_]+$/, "Tag can only contain lowercase letters, numbers, hyphens, and underscores");

/**
 * Zod schema for creating a new experience
 */
export const createExperienceSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(150, "Title must not exceed 150 characters")
    .trim(),
  story: z
    .string()
    .min(10, "Story narrative must be at least 10 characters")
    .max(10000, "Story narrative must not exceed 10,000 characters")
    .trim(),
  category_id: z.string().uuid("Invalid category ID format"),
  tags: z
    .array(z.string())
    .max(5, "You can attach at most 5 tags")
    .optional()
    .default([]),
  status: z.enum(["active", "hidden"]).optional().default("active"),
});

export type CreateExperienceInput = z.infer<typeof createExperienceSchema>;

/**
 * Zod schema for updating an existing experience
 */
export const updateExperienceSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(150, "Title must not exceed 150 characters")
    .trim()
    .optional(),
  story: z
    .string()
    .min(10, "Story narrative must be at least 10 characters")
    .max(10000, "Story narrative must not exceed 10,000 characters")
    .trim()
    .optional(),
  category_id: z.string().uuid("Invalid category ID format").optional(),
  tags: z
    .array(z.string())
    .max(5, "You can attach at most 5 tags")
    .optional(),
  status: z.enum(["active", "hidden"]).optional(),
});

export type UpdateExperienceInput = z.infer<typeof updateExperienceSchema>;

/**
 * Zod schema for feed query parameters
 */
export const feedQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  category: z.string().optional(),
  tag: z.string().optional(),
  q: z.string().trim().max(100).optional(),
  sort: z.enum(["latest", "recently_updated"]).optional().default("latest"),
  journey: z.enum(["all", "active", "long_running"]).optional().default("all"),
});

export type FeedQueryParams = z.infer<typeof feedQuerySchema>;

/**
 * Zod schema for bookmark toggle
 */
export const bookmarkSchema = z.object({
  experience_id: z.string().uuid("Invalid experience ID format"),
});

export type BookmarkInput = z.infer<typeof bookmarkSchema>;
