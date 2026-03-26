import { getHolidays, dateStr, isWeekend } from "./holidays";

export function getWorkingDays(y: number, m: number): number {
  const h = getHolidays(y);
  let c = 0;
  const dim = new Date(y, m + 1, 0).getDate();
  for (let d = 1; d <= dim; d++) {
    const dt = new Date(y, m, d);
    if (!isWeekend(dt) && !h.has(dateStr(dt))) c++;
  }
  return c;
}
