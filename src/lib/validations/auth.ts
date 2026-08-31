import { z } from "zod";

export const RESERVED_USERNAMES = [
  "admin",
  "moderator",
  "support",
  "official",
  "system",
  "root",
  "eside",
  "help",
  "security",
] as const;

export const registerSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(72, "Password cannot exceed 72 characters"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username cannot exceed 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
    .refine(
      (val) => !RESERVED_USERNAMES.includes(val.toLowerCase() as typeof RESERVED_USERNAMES[number]),
      {
        message: "This username is reserved and cannot be registered.",
      }
    ),
  bio: z.string().max(300, "Bio cannot exceed 300 characters").optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const profileUpdateSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username cannot exceed 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
    .refine(
      (val) => !RESERVED_USERNAMES.includes(val.toLowerCase() as typeof RESERVED_USERNAMES[number]),
      {
        message: "This username is reserved.",
      }
    )
    .optional(),
  bio: z.string().max(300, "Bio cannot exceed 300 characters").optional(),
  avatar_url: z.string().max(200, "Avatar identifier too long").optional().nullable(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
