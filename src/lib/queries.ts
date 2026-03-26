import { eq, and, gte, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { shifts, userSettings, kedvezmenyMap } from "@/db/schema";
import type { ShiftData } from "@/lib/calculations/constants";

export async function getUserSettings(userId: string) {
  const [settings] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);
  return settings;
}

export async function getMonthShifts(
  userId: string,
  year: number,
  month: number
): Promise<ShiftData[]> {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);

  const rows = await db
    .select()
    .from(shifts)
    .where(
      and(
        eq(shifts.userId, userId),
        gte(shifts.startTime, start),
        lt(shifts.startTime, end)
      )
    )
    .orderBy(shifts.startTime);

  return rows.map((r) => ({
    id: r.id,
    start: r.startTime.toISOString(),
    end: r.endTime.toISOString(),
    behivas: r.isBehivas,
    piheno: r.isPihenonap,
  }));
}

export async function getAllShiftsForCalc(
  userId: string,
  year: number
): Promise<ShiftData[]> {
  // Get shifts for the year and surrounding months for prev/next calc
  const start = new Date(year - 1, 0, 1);
  const end = new Date(year + 2, 0, 1);

  const rows = await db
    .select()
    .from(shifts)
    .where(
      and(
        eq(shifts.userId, userId),
        gte(shifts.startTime, start),
        lt(shifts.startTime, end)
      )
    )
    .orderBy(shifts.startTime);

  return rows.map((r) => ({
    id: r.id,
    start: r.startTime.toISOString(),
    end: r.endTime.toISOString(),
    behivas: r.isBehivas,
    piheno: r.isPihenonap,
  }));
}

export async function getKedvezmeny(
  userId: string,
  year: number,
  month: number
): Promise<boolean | null> {
  const [row] = await db
    .select()
    .from(kedvezmenyMap)
    .where(
      and(
        eq(kedvezmenyMap.userId, userId),
        eq(kedvezmenyMap.year, year),
        eq(kedvezmenyMap.month, month)
      )
    )
    .limit(1);
  return row ? row.kedvezmenyes : null;
}
