import type { ShiftData, MonthCalcResult, HolidayData } from "./constants";
import { dateStr, isWeekend } from "./holidays";
import { getWorkingDays } from "./working-days";
import { SZJA_CAP } from "./constants";

/**
 * Clip a shift to a specific month boundary.
 * Shifts that span midnight between months are split — only the portion
 * within [monthStart, monthEnd) is counted for that month's calculation.
 */
function clipShiftToMonth(
  shift: ShiftData,
  monthStart: Date,
  monthEnd: Date
): { start: Date; end: Date } | null {
  const sTime = new Date(shift.start);
  const eTime = new Date(shift.end);

  const clippedStart = sTime < monthStart ? monthStart : sTime;
  const clippedEnd = eTime > monthEnd ? monthEnd : eTime;

  if (clippedStart >= clippedEnd) return null;
  return { start: clippedStart, end: clippedEnd };
}

/**
 * Check if a specific hour is within a holiday period.
 * holidays is a Map from date string to holiday data (with optional startHour/endHour).
 */
function isHolidayHour(holidayMap: Map<string, HolidayData>, dateKey: string, hour: number): boolean {
  const h = holidayMap.get(dateKey);
  if (!h) return false;
  const start = h.startHour ?? 0;
  const end = h.endHour ?? 24;
  return hour >= start && hour < end;
}

export function calcMonthData(
  shifts: ShiftData[],
  year: number,
  month: number,
  hoursPerDay: number,
  illetmeny: number,
  holidays: HolidayData[]
): MonthCalcResult {
  const munkaNapok = getWorkingDays(year, month, holidays);
  const kotelesOrak = munkaNapok * hoursPerDay;
  const orabér = illetmeny / ((174 * hoursPerDay) / 8);

  // Build holiday lookup map (date -> holiday data)
  const holidayMap = new Map<string, HolidayData>();
  for (const h of holidays) {
    holidayMap.set(h.date, h);
  }

  // Month boundaries for clipping
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 1);

  // Find all shifts that overlap this month (not just shifts starting in this month)
  const monthShifts = shifts
    .filter((s) => {
      const sTime = new Date(s.start);
      const eTime = new Date(s.end);
      return sTime < monthEnd && eTime > monthStart;
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  // Segment shifts into hourly blocks, clipped to month boundaries
  interface Segment {
    fraction: number;
    napszak: "normal" | "delutan" | "ejszaka";
    unnep: boolean;
    hetvege: boolean;
    behivas: boolean;
  }

  const segments: Segment[] = [];

  for (const shift of monthShifts) {
    const clipped = clipShiftToMonth(shift, monthStart, monthEnd);
    if (!clipped) continue;

    let cur = new Date(clipped.start.getTime());
    const end = clipped.end;

    while (cur < end) {
      const next = new Date(
        Math.min(cur.getTime() + 3600000, end.getTime())
      );
      const frac = (next.getTime() - cur.getTime()) / 3600000;
      const ds = dateStr(cur);
      const h = cur.getHours();

      let napszak: "normal" | "delutan" | "ejszaka" = "normal";
      if (h >= 22 || h < 6) napszak = "ejszaka";
      else if (h >= 14) napszak = "delutan";

      segments.push({
        fraction: frac,
        napszak,
        unnep: isHolidayHour(holidayMap, ds, h),
        hetvege: false,
        behivas: !!shift.behivas,
      });
      cur = next;
    }
  }

  // Two-pass calculation:
  // Pass 1: Accumulate napszak + categorize hours
  // Pass 2: Calculate behívás/túlóra based on month-end totals (not chronological)

  let totalH = 0;
  const napszakH = { normal: 0, delutan: 0, ejszaka: 0 };
  let unnepH = 0;
  let hetvegeH = 0;
  let behivasH = 0;
  let tuloraH = 0;

  // Pass 1: count all hours by category
  let totalRegularH = 0; // non-ünnep, non-pihenő, non-behívás
  let totalBehivasH = 0; // behívás hours (pending 200% decision)

  for (const seg of segments) {
    totalH += seg.fraction;

    // Napszak pótlék: EVERY hour gets napszak classification
    napszakH[seg.napszak] += seg.fraction;

    // Categorize
    // Ünnep: gets 100% pótlék BUT also counts toward kötelező fulfillment
    // Behívás: pending 200% decision based on month-end totals
    // Regular: counts toward kötelező
    if (seg.unnep) {
      unnepH += seg.fraction;
      totalRegularH += seg.fraction; // ünnep counts toward kötelező too
    } else if (seg.behivas) {
      totalBehivasH += seg.fraction;
    } else {
      totalRegularH += seg.fraction;
    }
  }

  // Pass 2: Calculate behívás and túlóra based on month-end totals
  // OMSZ logic: check if regular hours meet kötelező at month end,
  // then determine behívás 200% and túlóra 150% accordingly.
  //
  // If regular >= kötelező: ALL behívás → 200%, regular overflow → 150% túlóra
  // If regular < kötelező: behívás fills gap first (no 200%), rest → 200%
  //   And no regular túlóra in this case.

  if (totalRegularH >= kotelesOrak) {
    // Regular hours already cover kötelező
    // → ALL behívás hours get 200%
    // → Regular hours above kötelező get 150% túlóra
    behivasH = totalBehivasH;
    tuloraH = totalRegularH - kotelesOrak;
  } else {
    // Regular hours don't cover kötelező
    // → Behívás first fills the gap (no 200% for that portion)
    // → Remaining behívás above kötelező gets 200%
    const gap = kotelesOrak - totalRegularH;
    if (totalBehivasH > gap) {
      behivasH = totalBehivasH - gap;
    }
    // No túlóra — regular hours are under kötelező
  }

  const delutanPotlek = Math.round(orabér * 0.2 * napszakH.delutan);
  const ejszakaPotlek = Math.round(orabér * 0.5 * napszakH.ejszaka);
  const unnepPotlek = Math.round(orabér * 1.0 * unnepH);
  const hetvegePotlek = Math.round(orabér * 1.0 * hetvegeH);
  const tuloraPotlek = Math.round(orabér * 1.5 * tuloraH);
  const behivasPotlek = Math.round(orabér * 2.0 * behivasH);
  const napszakTotal = delutanPotlek + ejszakaPotlek;
  const rendkivuliTotal =
    unnepPotlek + hetvegePotlek + tuloraPotlek + behivasPotlek;
  const potlekTotal = napszakTotal + rendkivuliTotal;

  return {
    munkaNapok,
    kotelesOrak,
    orabér,
    totalH,
    napszakH,
    unnepH,
    hetvegeH,
    behivasH,
    tuloraH,
    delutanPotlek,
    ejszakaPotlek,
    unnepPotlek,
    hetvegePotlek,
    tuloraPotlek,
    behivasPotlek,
    napszakTotal,
    rendkivuliTotal,
    potlekTotal,
    monthShifts,
  };
}

export function calcSzja(
  brutto: number,
  year: number,
  kedvezmenyes: boolean
): number {
  if (!kedvezmenyes) return Math.round(brutto * 0.15);
  const cap = SZJA_CAP[year] || 715765;
  if (brutto <= cap) return 0;
  return Math.round((brutto - cap) * 0.15);
}

/**
 * Determine if 25-under tax benefit applies for a given month.
 * If birthDate is provided: benefit applies until the month they turn 25 (inclusive).
 * If no birthDate: no benefit (safe default, user can override per-month via kedvezmeny_map).
 */
export function defaultKedv(y: number, m: number, birthDate?: string | null): boolean {
  if (!birthDate) return false;
  // birthDate = "YYYY-MM-DD"
  const [by, bm] = birthDate.split("-").map(Number);
  // Turns 25 in year by+25, month bm-1 (0-indexed)
  const turns25Year = by + 25;
  const turns25Month = bm - 1; // convert to 0-indexed
  // Benefit applies UNTIL the month they turn 25 (inclusive that month)
  const targetVal = y * 12 + m;
  const turns25Val = turns25Year * 12 + turns25Month;
  return targetVal <= turns25Val;
}
