import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAllShiftsForCalc, getSettingsForMonth } from "@/lib/queries";
import { calcMonthData } from "@/lib/calculations/payroll";
import { getHolidays } from "@/lib/calculations/holidays";
import { PotlekokContent } from "@/components/payroll/potlekok-content";

interface Props {
  searchParams: Promise<{ year?: string; month?: string }>;
}

export default async function PotlekokPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const params = await searchParams;
  const now = new Date();
  const year = Number(params.year) || now.getFullYear();
  const month = Number(params.month ?? now.getMonth());

  const [settings, allShifts] = await Promise.all([
    getSettingsForMonth(session.user.id, year, month),
    getAllShiftsForCalc(session.user.id, year),
  ]);

  const holidays = getHolidays(year);
  getHolidays(year + 1).forEach((v) => holidays.add(v));

  const calc = calcMonthData(
    allShifts,
    year,
    month,
    settings.hoursPerDay,
    settings.illetmeny,
    holidays
  );

  return (
    <PotlekokContent
      year={year}
      month={month}
      calc={calc}
      orabér={calc.orabér}
    />
  );
}
