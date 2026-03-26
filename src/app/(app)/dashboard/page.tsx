import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAllShiftsForCalc, getUserSettings, getKedvezmeny } from "@/lib/queries";
import { calcMonthData, calcSzja, defaultKedv, getHolidaysForRange } from "@/lib/calculations/payroll";
import { getHolidays } from "@/lib/calculations/holidays";
import { MFULL, fmt } from "@/lib/calculations/constants";
import { MonthSelector, useMonthParams } from "@/components/shared/month-selector";
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

  const [settings, allShifts, kedvDb] = await Promise.all([
    getUserSettings(session.user.id),
    getAllShiftsForCalc(session.user.id, year),
    getKedvezmeny(session.user.id, year, month),
  ]);

  const illetmeny = settings?.illetmeny ?? 457500;
  const hoursPerDay = Number(settings?.hoursPerDay ?? 6);
  const thisKedv = kedvDb ?? defaultKedv(year, month);

  // Current month holidays
  const holidays = getHolidays(year);
  getHolidays(year + 1).forEach((v) => holidays.add(v));

  // Previous month for payroll calc
  const prevM = month === 0 ? 11 : month - 1;
  const prevY = month === 0 ? year - 1 : year;
  const prevHol = getHolidays(prevY);
  getHolidays(prevY + 1).forEach((v) => prevHol.add(v));

  const calc = calcMonthData(allShifts, year, month, hoursPerDay, illetmeny, holidays);
  const prevCalc = calcMonthData(allShifts, prevY, prevM, hoursPerDay, illetmeny, prevHol);

  // Payroll for this month
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
    />
  );
}
