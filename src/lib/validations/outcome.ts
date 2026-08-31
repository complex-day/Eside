import { z } from "zod";

/**
 * Validation schema for creating a new outcome milestone.
 * Supports arbitrary integer days_after values (0 to 3650 days).
 */
export const createOutcomeSchema = z.object({
  days_after: z.coerce
    .number({
      required_error: "Days after is required.",
      invalid_type_error: "Days after must be a number.",
    })
    .int({ message: "Days after must be an integer." })
    .min(0, { message: "Days after cannot be negative." })
    .max(3650, { message: "Days after cannot exceed 3650 days (10 years)." }),
  content: z
    .string({
      required_error: "Outcome narrative is required.",
    })
    .trim()
    .min(10, { message: "Outcome narrative must be at least 10 characters." })
    .max(5000, { message: "Outcome narrative cannot exceed 5000 characters." }),
});

export const updateOutcomeSchema = z.object({
  days_after: z.coerce
    .number()
    .int({ message: "Days after must be an integer." })
    .min(0, { message: "Days after cannot be negative." })
    .max(3650, { message: "Days after cannot exceed 3650 days (10 years)." })
    .optional(),
  content: z
    .string()
    .trim()
    .min(10, { message: "Outcome narrative must be at least 10 characters." })
    .max(5000, { message: "Outcome narrative cannot exceed 5000 characters." })
    .optional(),
});

export type CreateOutcomeInput = z.infer<typeof createOutcomeSchema>;
export type UpdateOutcomeInput = z.infer<typeof updateOutcomeSchema>;
