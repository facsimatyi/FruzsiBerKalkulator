import type { ShiftData, MonthCalcResult } from "./constants";
import { getHolidays, dateStr } from "./holidays";
import { getWorkingDays } from "./working-days";
import { SZJA_CAP } from "./constants";

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

  const monthShifts = shifts
    .filter((s) => {
      const d = new Date(s.start);
      return d.getFullYear() === year && d.getMonth() === month;
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  // Segment shifts into hourly blocks
  interface Segment {
    fraction: number;
    napszak: "normal" | "delutan" | "ejszaka";
    unnep: boolean;
    piheno: boolean;
    behivas: boolean;
  }

  const segments: Segment[] = [];

  for (const shift of monthShifts) {
    let cur = new Date(shift.start);
    const end = new Date(shift.end);
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
        piheno: !!shift.piheno,
        behivas: !!shift.behivas,
      });
      cur = next;
    }
  }

  let totalH = 0;
  const napszakH = { normal: 0, delutan: 0, ejszaka: 0 };
  let unnepH = 0;
  let pihenoH = 0;
  let behivasH = 0;
  let tuloraH = 0;
  let cumAll = 0;

  for (const seg of segments) {
    totalH += seg.fraction;
    cumAll += seg.fraction;
    napszakH[seg.napszak] += seg.fraction;
    if (seg.unnep) {
      unnepH += seg.fraction;
    } else if (seg.piheno) {
      pihenoH += seg.fraction;
    } else if (cumAll > kotelesOrak) {
      const overPart = Math.min(seg.fraction, cumAll - kotelesOrak);
      if (seg.behivas) {
        behivasH += overPart;
      } else {
        tuloraH += overPart;
      }
    }
  }

  const delutanPotlek = Math.round(orabér * 0.2 * napszakH.delutan);
  const ejszakaPotlek = Math.round(orabér * 0.5 * napszakH.ejszaka);
  const unnepPotlek = Math.round(orabér * 1.5 * unnepH);
  const pihenoPotlek = Math.round(orabér * 1.0 * pihenoH);
  const tuloraPotlek = Math.round(orabér * 1.5 * tuloraH);
  const behivasPotlek = Math.round(orabér * 2.0 * behivasH);
  const napszakTotal = delutanPotlek + ejszakaPotlek;
  const rendkivuliTotal =
    unnepPotlek + pihenoPotlek + tuloraPotlek + behivasPotlek;
  const potlekTotal = napszakTotal + rendkivuliTotal;

  return {
    munkaNapok,
    kotelesOrak,
    orabér,
    totalH,
    napszakH,
    unnepH,
    pihenoH,
    behivasH,
    tuloraH,
    delutanPotlek,
    ejszakaPotlek,
    unnepPotlek,
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
