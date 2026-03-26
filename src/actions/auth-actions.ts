"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, userSettings } from "@/db/schema";
import { registerSchema } from "@/lib/validators";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function registerUser(_prevState: unknown, formData: FormData) {
  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { name, email, password } = parsed.data;

  // Check if email exists
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    return { error: "Ez az email cím már regisztrálva van" };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Create user + default settings in one go
  const [newUser] = await db
    .insert(users)
    .values({ email, passwordHash, name })
    .returning({ id: users.id });

  // Create settings with illetmeny=0 to trigger onboarding
  await db.insert(userSettings).values({ userId: newUser.id, illetmeny: 0, hoursPerDay: "0" });

  return { success: true };
}

export async function loginUser(_prevState: unknown, formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return { error: "Hibás email vagy jelszó" };
      }
      return { error: "Hiba történt a bejelentkezés során" };
    }
    // NEXT_REDIRECT is not an AuthError — must rethrow
    throw error;
  }
}
