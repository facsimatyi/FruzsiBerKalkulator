"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, userSettings } from "@/db/schema";
import { registerSchema } from "@/lib/validators";
import { signIn, auth } from "@/lib/auth";
import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";

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

export async function changePassword(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Nem vagy bejelentkezve" };

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!currentPassword || !newPassword) {
    return { error: "Minden mező kitöltése kötelező" };
  }
  if (newPassword.length < 6) {
    return { error: "Az új jelszó legalább 6 karakter legyen" };
  }
  if (newPassword !== confirmPassword) {
    return { error: "A jelszavak nem egyeznek" };
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user) return { error: "Felhasználó nem található" };

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return { error: "Hibás jelenlegi jelszó" };

  const newHash = await bcrypt.hash(newPassword, 12);
  await db
    .update(users)
    .set({ passwordHash: newHash })
    .where(eq(users.id, session.user.id));

  return { success: true };
}

export async function deleteAccount(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Nem vagy bejelentkezve" };

  const password = formData.get("password") as string;
  if (!password) return { error: "Add meg a jelszavad a törléshez" };

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user) return { error: "Felhasználó nem található" };

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return { error: "Hibás jelszó" };

  // CASCADE delete removes all related data (settings, shifts, kedvezmeny_map, settings_periods)
  await db.delete(users).where(eq(users.id, session.user.id));

  return { success: true, deleted: true };
}
