import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAllShiftsForCalc, getUserSettings, getKedvezmeny } from "@/lib/queries";
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

  const [settings, allShifts, kedvDb] = await Promise.all([
    getUserSettings(session.user.id),
    getAllShiftsForCalc(session.user.id, year),
    getKedvezmeny(session.user.id, year, month),
  ]);

  const illetmeny = settings?.illetmeny ?? 457500;
  const hoursPerDay = Number(settings?.hoursPerDay ?? 6);
  const thisKedv = kedvDb ?? defaultKedv(year, month);

  const holidays = getHolidays(year);
  getHolidays(year + 1).forEach((v) => holidays.add(v));

  const prevM = month === 0 ? 11 : month - 1;
  const prevY = month === 0 ? year - 1 : year;
  const prevHol = getHolidays(prevY);
  getHolidays(prevY + 1).forEach((v) => prevHol.add(v));

  const calc = calcMonthData(allShifts, year, month, hoursPerDay, illetmeny, holidays);
  const prevCalc = calcMonthData(allShifts, prevY, prevM, hoursPerDay, illetmeny, prevHol);

  const thisBrutto = illetmeny + prevCalc.potlekTotal;
  const thisTb = Math.round(illetmeny * 0.185) + Math.round(prevCalc.potlekTotal * 0.185);
  const thisSzja = calcSzja(thisBrutto, year, thisKedv);
  const thisNetto = thisBrutto - thisTb - thisSzja;

  // Next month estimate
  const nextM = (month + 1) % 12;
  const nextY = month === 11 ? year + 1 : year;
  const nextKedvDb = await getKedvezmeny(session.user.id, nextY, nextM);
  const nextKedv = nextKedvDb ?? defaultKedv(nextY, nextM);
  const nextBrutto = illetmeny + calc.potlekTotal;
  const nextTb = Math.round(nextBrutto * 0.185);
  const nextSzja = calcSzja(nextBrutto, nextY, nextKedv);
  const nextNetto = nextBrutto - nextTb - nextSzja;

  return (
    <PayrollContent
      year={year}
      month={month}
      calc={calc}
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
