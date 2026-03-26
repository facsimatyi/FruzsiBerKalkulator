import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAllShiftsForCalc, getSettingsForMonth, getKedvezmeny, getUserSettings } from "@/lib/queries";
import { calcMonthData, calcSzja, defaultKedv } from "@/lib/calculations/payroll";
import { getHolidays } from "@/lib/calculations/holidays";
import { DashboardContent } from "@/components/payroll/dashboard-content";

interface Props {
  searchParams: Promise<{ year?: string; month?: string }>;
}

export default async function DashboardPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const params = await searchParams;
  const now = new Date();
  const year = Number(params.year) || now.getFullYear();
  const month = Number(params.month ?? now.getMonth());

  const prevM = month === 0 ? 11 : month - 1;
  const prevY = month === 0 ? year - 1 : year;
  const nextM = (month + 1) % 12;

  const [thisSettings, prevSettings, allShifts, kedvDb, settings] = await Promise.all([
    getSettingsForMonth(session.user.id, year, month),
    getSettingsForMonth(session.user.id, prevY, prevM),
    getAllShiftsForCalc(session.user.id, year),
    getKedvezmeny(session.user.id, year, month),
    getUserSettings(session.user.id),
  ]);

  const birthDate = settings?.birthDate ?? null;
  const thisKedv = kedvDb ?? defaultKedv(year, month, birthDate);

  // Holidays
  const holidays = getHolidays(year);
  getHolidays(year + 1).forEach((v) => holidays.add(v));
  const prevHol = getHolidays(prevY);
  getHolidays(prevY + 1).forEach((v) => prevHol.add(v));

  // Current month calculation
  const calc = calcMonthData(allShifts, year, month, thisSettings.hoursPerDay, thisSettings.illetmeny, holidays);
  const prevCalc = calcMonthData(allShifts, prevY, prevM, prevSettings.hoursPerDay, prevSettings.illetmeny, prevHol);

  // This month payroll: this month illetmeny + previous month pótlékok
  const illetmeny = thisSettings.illetmeny;
  const thisBrutto = illetmeny + prevCalc.potlekTotal;
  const thisTb = Math.round(illetmeny * 0.185) + Math.round(prevCalc.potlekTotal * 0.185);
  const thisSzja = calcSzja(thisBrutto, year, thisKedv);
  const thisNetto = thisBrutto - thisTb - thisSzja;

  const progressPct = calc.kotelesOrak > 0 ? Math.min(100, (calc.totalH / calc.kotelesOrak) * 100) : 0;

  return (
    <DashboardContent
      year={year}
      month={month}
      calc={calc}
      thisNetto={thisNetto}
      thisBrutto={thisBrutto}
      thisTb={thisTb}
      thisSzja={thisSzja}
      thisKedv={thisKedv}
      progressPct={progressPct}
      nextMonth={nextM}
    />
  );
}
