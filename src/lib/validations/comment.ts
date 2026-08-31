import { z } from "zod";

/**
 * Validation schema for posting and editing comments.
 */
export const createCommentSchema = z.object({
  content: z
    .string({
      required_error: "Comment content is required.",
    })
    .trim()
    .min(2, { message: "Comment must be at least 2 characters." })
    .max(1500, { message: "Comment cannot exceed 1500 characters." }),
});

export const updateCommentSchema = z.object({
  content: z
    .string({
      required_error: "Comment content is required.",
    })
    .trim()
    .min(2, { message: "Comment must be at least 2 characters." })
    .max(1500, { message: "Comment cannot exceed 1500 characters." }),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
