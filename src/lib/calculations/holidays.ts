export function easterSunday(y: number): Date {
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

export function getHolidays(year: number): Set<string> {
  const easter = easterSunday(year);
  const ms = easter.getTime();
  const D = 86400000;
  const h = new Set<string>();

  const a = (m: number, d: number) =>
    h.add(
      `${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    );

  a(1, 1);   // Újév
  a(3, 15);  // Nemzeti ünnep
  a(5, 1);   // Munka ünnepe
  a(8, 20);  // Államalapítás
  a(10, 23); // 1956-os forradalom
  a(11, 1);  // Mindenszentek
  a(12, 25); // Karácsony
  a(12, 26); // Karácsony 2. nap

  // Húsvét hétfő (+1), Nagypéntek (-2), Pünkösdhétfő (+49)
  [1, -2, 49].forEach((off) => {
    const dt = new Date(ms + off * D);
    a(dt.getMonth() + 1, dt.getDate());
  });

  return h;
}

export function dateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function isWeekend(d: Date): boolean {
  return d.getDay() === 0 || d.getDay() === 6;
}
