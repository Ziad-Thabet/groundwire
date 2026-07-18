import { z } from "zod";

export const createInviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "member"], {
    message: "Role must be either 'admin' or 'member'",
  }),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(1, "Invite token is required"),
  name: z.string().trim().min(1).max(100).optional(),
  password: z
    .string()
    .min(10, "Password must be at least 10 characters")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number")
    .optional(),
});

export type CreateInviteInput = z.infer<typeof createInviteSchema>;
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
