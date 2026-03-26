import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAllShiftsForCalc, getSettingsForMonth, getKedvezmeny, getUserSettings } from "@/lib/queries";
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
  const prevHol = getHolidays(prevY);
  getHolidays(prevY + 1).forEach((v) => prevHol.add(v));

  // Previous month pótlékok (these appear on THIS month's bérszám)
  const prevCalc = calcMonthData(allShifts, prevY, prevM, prevSettings.hoursPerDay, prevSettings.illetmeny, prevHol);

  // This month's bérszám
  const illetmeny = thisSettings.illetmeny;
  const thisBrutto = illetmeny + prevCalc.potlekTotal;
  const thisTb = Math.round(illetmeny * 0.185) + Math.round(prevCalc.potlekTotal * 0.185);
  const thisSzja = calcSzja(thisBrutto, year, thisKedv);
  const thisNetto = thisBrutto - thisTb - thisSzja;

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
    />
  );
}
