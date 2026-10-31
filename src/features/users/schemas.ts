import { z } from "zod";

export const profileSchema = z.object({
  fullName: z.string().trim().min(1, "Enter your name").max(120),
});

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password").max(72),
    newPassword: z.string().min(8, "Use at least 8 characters").max(72, "Use at most 72 characters"),
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ProfileValues = z.infer<typeof profileSchema>;
export type PasswordValues = z.infer<typeof passwordSchema>;
