import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Érvénytelen email cím"),
  password: z.string().min(1, "Jelszó megadása kötelező"),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Név legalább 2 karakter"),
    email: z.string().email("Érvénytelen email cím"),
    password: z.string().min(8, "Jelszó legalább 8 karakter"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "A jelszavak nem egyeznek",
    path: ["confirmPassword"],
  });

export const shiftSchema = z.object({
  startTime: z.string().min(1, "Kezdés megadása kötelező"),
  endTime: z.string().min(1, "Vége megadása kötelező"),
  isBehivas: z.boolean().default(false),
  isPihenonap: z.boolean().default(false),
});

export const settingsSchema = z.object({
  illetmeny: z.number().min(0).max(10000000),
  hoursPerDay: z.number().min(0.5).max(24),
  selectedBer: z.number().min(-1).max(20),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ShiftInput = z.infer<typeof shiftSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
