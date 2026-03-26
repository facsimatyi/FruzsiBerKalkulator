import type { ShiftData, MonthCalcResult } from "./constants";
import { getHolidays, dateStr, isWeekend } from "./holidays";
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

export function calcMonthData(
  shifts: ShiftData[],
  year: number,
  month: number,
  hoursPerDay: number,
  illetmeny: number,
  holidays: Set<string>
): MonthCalcResult {
  const munkaNapok = getWorkingDays(year, month);
  const kotelesOrak = munkaNapok * hoursPerDay;
  const orabér = illetmeny / ((174 * hoursPerDay) / 8);

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
    piheno: boolean;
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
        unnep: holidays.has(ds),
        // Hétvége is manual — set via isPihenonap on the shift
        // (OMSZ assigns specific shifts as "hétvége", not all Sat/Sun hours)
        hetvege: false,
        piheno: !!shift.piheno,
        behivas: !!shift.behivas,
      });
      cur = next;
    }
  }

  // Accumulate hours
  let totalH = 0;
  const napszakH = { normal: 0, delutan: 0, ejszaka: 0 };
  let unnepH = 0;
  let hetvegeH = 0;
  let pihenoH = 0;
  let behivasH = 0;
  let tuloraH = 0;
  let cumAll = 0;

  for (const seg of segments) {
    totalH += seg.fraction;
    cumAll += seg.fraction;

    // Napszak pótlék: EVERY hour gets napszak classification
    // (including holiday/pihenő hours — they stack in OMSZ)
    napszakH[seg.napszak] += seg.fraction;

    // Rendkívüli pótlékok:
    // Ünnepnap: ALL hours on a public holiday → 150% (automatic)
    // Pihenőnap/Hétvége: manually flagged shifts → 100%
    // Behívás: manually flagged → 200%
    // Túlóra: remaining hours beyond kötelező → 150%
    if (seg.unnep) {
      unnepH += seg.fraction;
    } else if (seg.piheno) {
      pihenoH += seg.fraction;
    } else if (seg.behivas) {
      behivasH += seg.fraction;
    } else if (cumAll > kotelesOrak) {
      // Only regular (non-ünnep, non-pihenő, non-behívás) hours count toward overtime
      const overPart = Math.min(seg.fraction, cumAll - kotelesOrak);
      tuloraH += overPart;
    }
  }

  const delutanPotlek = Math.round(orabér * 0.2 * napszakH.delutan);
  const ejszakaPotlek = Math.round(orabér * 0.5 * napszakH.ejszaka);
  const unnepPotlek = Math.round(orabér * 1.5 * unnepH);
  const hetvegePotlek = Math.round(orabér * 1.0 * hetvegeH);
  const pihenoPotlek = Math.round(orabér * 1.0 * pihenoH);
  const tuloraPotlek = Math.round(orabér * 1.5 * tuloraH);
  const behivasPotlek = Math.round(orabér * 2.0 * behivasH);
  const napszakTotal = delutanPotlek + ejszakaPotlek;
  const rendkivuliTotal =
    unnepPotlek + hetvegePotlek + pihenoPotlek + tuloraPotlek + behivasPotlek;
  const potlekTotal = napszakTotal + rendkivuliTotal;

  return {
    munkaNapok,
    kotelesOrak,
    orabér,
    totalH,
    napszakH,
    unnepH,
    hetvegeH,
    pihenoH,
    behivasH,
    tuloraH,
    delutanPotlek,
    ejszakaPotlek,
    unnepPotlek,
    hetvegePotlek,
    pihenoPotlek,
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

export function defaultKedv(y: number, m: number): boolean {
  return y < 2026 || (y === 2026 && m <= 1);
}

export function getHolidaysForRange(year: number): Set<string> {
  const s = new Set<string>();
  for (let y = year - 1; y <= year + 1; y++) {
    getHolidays(y).forEach((v) => s.add(v));
  }
  return s;
}
