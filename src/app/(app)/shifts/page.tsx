import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMonthShifts, getAllUserHolidaysForCalc } from "@/lib/queries";
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

  const [monthShifts, userHolidays] = await Promise.all([
    getMonthShifts(session.user.id, year, month),
    getAllUserHolidaysForCalc(session.user.id),
  ]);
  const holidays = userHolidays.map((h) => h.date);

  return (
    <ShiftsContent
      year={year}
      month={month}
      shifts={monthShifts}
      holidays={holidays}
    />
  );
}
