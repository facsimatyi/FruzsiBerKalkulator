import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMonthShifts } from "@/lib/queries";
import { getHolidays } from "@/lib/calculations/holidays";
import { MonthSelector } from "@/components/shared/month-selector";
import { ShiftsContent } from "@/components/shifts/shifts-content";

interface Props {
  searchParams: Promise<{ year?: string; month?: string }>;
}

export default async function ShiftsPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const params = await searchParams;
  const now = new Date();
  const year = Number(params.year) || now.getFullYear();
  const month = Number(params.month ?? now.getMonth());

  const monthShifts = await getMonthShifts(session.user.id, year, month);
  const holidays = getHolidays(year);
  getHolidays(year + 1).forEach((v) => holidays.add(v));

  return (
    <ShiftsContent
      year={year}
      month={month}
      shifts={monthShifts}
      holidays={Array.from(holidays)}
    />
  );
}
