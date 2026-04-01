import { dateStr, isWeekend } from "./holidays";
import type { HolidayData } from "./constants";

/**
 * Count working days in a month, excluding weekends and user-defined holidays.
 * A holiday counts as a non-working day only if it covers the full day (startHour=null/0, endHour=null/24).
 */
export function getWorkingDays(y: number, m: number, holidays: HolidayData[]): number {
  const holidayDates = new Set<string>();
  for (const h of holidays) {
    // Only full-day holidays reduce working days
    const isFullDay = (h.startHour === null || h.startHour === 0) && (h.endHour === null || h.endHour === 24);
    if (isFullDay) {
      holidayDates.add(h.date);
    }
  }

  let c = 0;
  const dim = new Date(y, m + 1, 0).getDate();
  for (let d = 1; d <= dim; d++) {
    const dt = new Date(y, m, d);
    if (!isWeekend(dt) && !holidayDates.has(dateStr(dt))) c++;
  }
  return c;
}
