"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userHolidays } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getHolidays } from "@/lib/calculations/holidays";

export async function seedDefaultHolidays(year: number) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Nem vagy bejelentkezve" };

  await seedHolidaysForUser(session.user.id, year);

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/payroll");
  return { success: true };
}

/** Seed default holidays for a specific user+year. Can be called from server code. */
export async function seedHolidaysForUser(userId: string, year: number) {
  const defaults = getHolidaysWithNames(year);

  for (const h of defaults) {
    await db
      .insert(userHolidays)
      .values({
        userId,
        date: h.date,
        name: h.name,
        startHour: null,
        endHour: null,
        isActive: true,
      })
      .onConflictDoNothing();
  }
}

/** Seed all relevant years (2024-2027) if user has no holidays at all. */
export async function ensureUserHasHolidays(userId: string) {
  const existing = await db
    .select({ id: userHolidays.id })
    .from(userHolidays)
    .where(eq(userHolidays.userId, userId))
    .limit(1);

  if (existing.length > 0) return; // Already has holidays

  for (const year of [2024, 2025, 2026, 2027]) {
    await seedHolidaysForUser(userId, year);
  }
}

export async function upsertHoliday(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Nem vagy bejelentkezve" };

  const date = formData.get("date") as string;
  const name = formData.get("name") as string;
  const startHourRaw = formData.get("startHour") as string;
  const endHourRaw = formData.get("endHour") as string;

  if (!date || !name) return { error: "Dátum és név kötelező" };

  const startHour = startHourRaw ? Number(startHourRaw) : null;
  const endHour = endHourRaw ? Number(endHourRaw) : null;

  await db
    .insert(userHolidays)
    .values({
      userId: session.user.id,
      date,
      name,
      startHour,
      endHour,
      isActive: true,
    })
    .onConflictDoUpdate({
      target: [userHolidays.userId, userHolidays.date],
      set: { name, startHour, endHour, isActive: true },
    });

  revalidatePath("/holidays");
  revalidatePath("/dashboard");
  revalidatePath("/payroll");
  return { success: true };
}

export async function toggleHoliday(id: string, isActive: boolean) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Nem vagy bejelentkezve" };

  await db
    .update(userHolidays)
    .set({ isActive })
    .where(and(eq(userHolidays.id, id), eq(userHolidays.userId, session.user.id)));

  revalidatePath("/holidays");
  revalidatePath("/dashboard");
  revalidatePath("/payroll");
}

export async function deleteHoliday(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Nem vagy bejelentkezve" };

  await db
    .delete(userHolidays)
    .where(and(eq(userHolidays.id, id), eq(userHolidays.userId, session.user.id)));

  revalidatePath("/holidays");
  revalidatePath("/dashboard");
  revalidatePath("/payroll");
}

/** Helper: Hungarian holiday names for seeding */
function getHolidaysWithNames(year: number): { date: string; name: string }[] {
  const pad = (n: number) => String(n).padStart(2, "0");
  const d = (m: number, day: number) => `${year}-${pad(m)}-${pad(day)}`;

  const holidays: { date: string; name: string }[] = [
    { date: d(1, 1), name: "Újév" },
    { date: d(3, 15), name: "Nemzeti ünnep" },
    { date: d(5, 1), name: "Munka ünnepe" },
    { date: d(8, 20), name: "Államalapítás" },
    { date: d(10, 23), name: "1956-os forradalom" },
    { date: d(11, 1), name: "Mindenszentek" },
    { date: d(12, 25), name: "Karácsony" },
    { date: d(12, 26), name: "Karácsony 2. nap" },
  ];

  // Easter-based
  const easter = easterSunday(year);
  const ms = easter.getTime();
  const DAY = 86400000;

  const easterMon = new Date(ms + 1 * DAY);
  holidays.push({ date: d(easterMon.getMonth() + 1, easterMon.getDate()), name: "Húsvéthétfő" });

  const goodFri = new Date(ms - 2 * DAY);
  holidays.push({ date: d(goodFri.getMonth() + 1, goodFri.getDate()), name: "Nagypéntek" });

  const pentMon = new Date(ms + 49 * DAY);
  holidays.push({ date: d(pentMon.getMonth() + 1, pentMon.getDate()), name: "Pünkösdhétfő" });

  return holidays.sort((a, b) => a.date.localeCompare(b.date));
}

function easterSunday(y: number): Date {
  const a = y % 19;
  const b = Math.floor(y / 100);
  const c = y % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mo = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(y, mo - 1, day);
}
