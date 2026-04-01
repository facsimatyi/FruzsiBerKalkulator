export interface BerCategory {
  label: string;
  min: number;
  max: number;
}

export const BERTABLA: BerCategory[] = [
  { label: "I. alap", min: 304000, max: 469000 },
  { label: "I. kiemelt", min: 377000, max: 529000 },
  { label: "II. alap", min: 381600, max: 561000 },
  { label: "II. kiemelt", min: 465000, max: 644000 },
  { label: "III. alap (mentőtiszt)", min: 410000, max: 684000 },
  { label: "III. kiemelt (ügy. mentőtiszt)", min: 498000, max: 770000 },
  { label: "IV. alap", min: 506000, max: 930000 },
  { label: "IV. kiemelt", min: 610000, max: 1100000 },
  { label: "V. alap", min: 530000, max: 1142000 },
  { label: "V. kiemelt", min: 635000, max: 1400000 },
];

export const SZJA_CAP: Record<number, number> = {
  2024: 576601,
  2025: 656785,
  2026: 715765,
};

export const MHU = [
  "Jan", "Feb", "Már", "Ápr", "Máj", "Jún",
  "Júl", "Aug", "Szep", "Okt", "Nov", "Dec",
];

export const MFULL = [
  "Január", "Február", "Március", "Április", "Május", "Június",
  "Július", "Augusztus", "Szeptember", "Október", "November", "December",
];

export const DN = ["V", "H", "K", "Sze", "Cs", "P", "Szo"];

export interface HolidayData {
  date: string;       // YYYY-MM-DD
  startHour: number | null; // null = 0 (egész nap)
  endHour: number | null;   // null = 24 (egész nap)
}

export interface ShiftData {
  id: string;
  start: string; // ISO datetime
  end: string;   // ISO datetime
  behivas: boolean;
}

export interface MonthCalcResult {
  munkaNapok: number;
  kotelesOrak: number;
  orabér: number;
  totalH: number;
  napszakH: { normal: number; delutan: number; ejszaka: number };
  unnepH: number;
  hetvegeH: number;
  behivasH: number;
  tuloraH: number;
  delutanPotlek: number;
  ejszakaPotlek: number;
  unnepPotlek: number;
  hetvegePotlek: number;
  tuloraPotlek: number;
  behivasPotlek: number;
  napszakTotal: number;
  rendkivuliTotal: number;
  potlekTotal: number;
  monthShifts: ShiftData[];
}

export const fmt = (n: number) => Math.round(n).toLocaleString("hu-HU");

/** Format hours: 8 → "8", 7.15 → "7.15", 7.1 → "7.10" */
export const fmtH = (n: number) => {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(2);
};
