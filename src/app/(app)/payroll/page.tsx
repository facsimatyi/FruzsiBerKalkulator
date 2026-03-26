import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAllShiftsForCalc, getSettingsForMonth, getKedvezmeny } from "@/lib/queries";
import { calcMonthData, calcSzja, defaultKedv } from "@/lib/calculations/payroll";
import { getHolidays } from "@/lib/calculations/holidays";
import { PayrollContent } from "@/components/payroll/payroll-content";

interface Props {
  searchParams: Promise<{ year?: string; month?: string }>;
}

export default async function PayrollPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const params = await searchParams;
  const now = new Date();
  const year = Number(params.year) || now.getFullYear();
  const month = Number(params.month ?? now.getMonth());

  const prevM = month === 0 ? 11 : month - 1;
  const prevY = month === 0 ? year - 1 : year;
  const nextM = (month + 1) % 12;
  const nextY = month === 11 ? year + 1 : year;

  const [thisSettings, prevSettings, nextSettings, allShifts, kedvDb, nextKedvDb] =
    await Promise.all([
      getSettingsForMonth(session.user.id, year, month),
      getSettingsForMonth(session.user.id, prevY, prevM),
      getSettingsForMonth(session.user.id, nextY, nextM),
      getAllShiftsForCalc(session.user.id, year),
      getKedvezmeny(session.user.id, year, month),
      getKedvezmeny(session.user.id, nextY, nextM),
    ]);

  const thisKedv = kedvDb ?? defaultKedv(year, month);
  const nextKedv = nextKedvDb ?? defaultKedv(nextY, nextM);

  // Holidays
  const prevHol = getHolidays(prevY);
  getHolidays(prevY + 1).forEach((v) => prevHol.add(v));
  const holidays = getHolidays(year);
  getHolidays(year + 1).forEach((v) => holidays.add(v));

  // Previous month pótlékok (these appear on THIS month's bérszám)
  const prevCalc = calcMonthData(allShifts, prevY, prevM, prevSettings.hoursPerDay, prevSettings.illetmeny, prevHol);
  // Current month pótlékok (for next month estimate)
  const calc = calcMonthData(allShifts, year, month, thisSettings.hoursPerDay, thisSettings.illetmeny, holidays);

  // This month's bérszám
  const illetmeny = thisSettings.illetmeny;
  const thisBrutto = illetmeny + prevCalc.potlekTotal;
  const thisTb = Math.round(illetmeny * 0.185) + Math.round(prevCalc.potlekTotal * 0.185);
  const thisSzja = calcSzja(thisBrutto, year, thisKedv);
  const thisNetto = thisBrutto - thisTb - thisSzja;

  // Next month estimate
  const nextIlletmeny = nextSettings.illetmeny;
  const nextBrutto = nextIlletmeny + calc.potlekTotal;
  const nextTb = Math.round(nextBrutto * 0.185);
  const nextSzja = calcSzja(nextBrutto, nextY, nextKedv);
  const nextNetto = nextBrutto - nextTb - nextSzja;

  return (
    <PayrollContent
      year={year}
      month={month}
      prevCalc={prevCalc}
      illetmeny={illetmeny}
      thisKedv={thisKedv}
      thisBrutto={thisBrutto}
      thisTb={thisTb}
      thisSzja={thisSzja}
      thisNetto={thisNetto}
      nextBrutto={nextBrutto}
      nextTb={nextTb}
      nextSzja={nextSzja}
      nextNetto={nextNetto}
      nextMonth={nextM}
    />
  );
}
