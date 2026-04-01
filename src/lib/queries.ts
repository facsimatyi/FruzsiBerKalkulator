import { eq, and, gte, lt, or, lte, desc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { shifts, userSettings, kedvezmenyMap, settingsPeriods, userHolidays } from "@/db/schema";
import type { ShiftData } from "@/lib/calculations/constants";

export async function getUserSettings(userId: string) {
  const [settings] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);
  return settings;
}

/**
 * Get the effective settings for a specific month.
 * Finds the most recent settings_periods row where (effective_year, effective_month) <= (year, month).
 * Falls back to user_settings if no period exists.
 */
export async function getSettingsForMonth(
  userId: string,
  year: number,
  month: number
): Promise<{ illetmeny: number; hoursPerDay: number; selectedBer: number }> {
  // Find the most recent period that's on or before the target month
  // effective_year * 12 + effective_month <= year * 12 + month
  const targetVal = year * 12 + month;

  const [period] = await db
    .select()
    .from(settingsPeriods)
    .where(
      and(
        eq(settingsPeriods.userId, userId),
        sql`(${settingsPeriods.effectiveYear} * 12 + ${settingsPeriods.effectiveMonth}) <= ${targetVal}`
      )
    )
    .orderBy(
      desc(sql`(${settingsPeriods.effectiveYear} * 12 + ${settingsPeriods.effectiveMonth})`)
    )
    .limit(1);

  if (period) {
    return {
      illetmeny: period.illetmeny,
      hoursPerDay: Number(period.hoursPerDay),
      selectedBer: period.selectedBer,
    };
  }

  // No period found for this month — try the earliest period as fallback
  // (for months before the first defined period)
  const [earliest] = await db
    .select()
    .from(settingsPeriods)
    .where(eq(settingsPeriods.userId, userId))
    .orderBy(sql`${settingsPeriods.effectiveYear} * 12 + ${settingsPeriods.effectiveMonth}`)
    .limit(1);

  if (earliest) {
    return {
      illetmeny: earliest.illetmeny,
      hoursPerDay: Number(earliest.hoursPerDay),
      selectedBer: earliest.selectedBer,
    };
  }

  // No periods at all — fallback to user_settings
  const settings = await getUserSettings(userId);
  return {
    illetmeny: settings?.illetmeny ?? 457500,
    hoursPerDay: Number(settings?.hoursPerDay ?? 6),
    selectedBer: settings?.selectedBer ?? -1,
  };
}

/**
 * Get all settings periods for a user (for the settings UI).
 */
export async function getSettingsPeriods(userId: string) {
  return db
    .select()
    .from(settingsPeriods)
    .where(eq(settingsPeriods.userId, userId))
    .orderBy(desc(settingsPeriods.effectiveYear), desc(settingsPeriods.effectiveMonth));
}

export async function getMonthShifts(
  userId: string,
  year: number,
  month: number
): Promise<ShiftData[]> {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);

  // Get shifts that OVERLAP this month (not just start in it)
  // A shift overlaps if: startTime < monthEnd AND endTime > monthStart
  const rows = await db
    .select()
    .from(shifts)
    .where(
      and(
        eq(shifts.userId, userId),
        lt(shifts.startTime, end),
        gte(shifts.endTime, start)
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
        lt(shifts.startTime, end),
        gte(shifts.endTime, start)
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

export async function getUserHolidays(userId: string, year?: number) {
  if (year !== undefined) {
    const yearStr = String(year);
    return db
      .select()
      .from(userHolidays)
      .where(
        and(
          eq(userHolidays.userId, userId),
          sql`${userHolidays.date} LIKE ${yearStr + '%'}`
        )
      )
      .orderBy(userHolidays.date);
  }
  return db
    .select()
    .from(userHolidays)
    .where(eq(userHolidays.userId, userId))
    .orderBy(userHolidays.date);
}

export async function getAllUserHolidaysForCalc(
  userId: string
): Promise<{ date: string; startHour: number | null; endHour: number | null }[]> {
  const rows = await db
    .select({
      date: userHolidays.date,
      startHour: userHolidays.startHour,
      endHour: userHolidays.endHour,
    })
    .from(userHolidays)
    .where(
      and(
        eq(userHolidays.userId, userId),
        eq(userHolidays.isActive, true)
      )
    );
  return rows;
}
