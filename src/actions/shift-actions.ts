"use server";

import { revalidatePath } from "next/cache";
import { eq, and, gte, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { shifts } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function createShift(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Nem vagy bejelentkezve" };

  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const isBehivas = formData.get("isBehivas") === "true";
  const isPihenonap = formData.get("isPihenonap") === "true";

  if (!startTime || !endTime || new Date(endTime) <= new Date(startTime)) {
    return { error: "Érvénytelen időpontok" };
  }

  await db.insert(shifts).values({
    userId: session.user.id,
    startTime: new Date(startTime),
    endTime: new Date(endTime),
    isBehivas,
    isPihenonap,
  });

  revalidatePath("/shifts");
  revalidatePath("/dashboard");
  revalidatePath("/payroll");
  return { success: true };
}

export async function deleteShift(shiftId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Nem vagy bejelentkezve" };

  await db
    .delete(shifts)
    .where(and(eq(shifts.id, shiftId), eq(shifts.userId, session.user.id)));

  revalidatePath("/shifts");
  revalidatePath("/dashboard");
  revalidatePath("/payroll");
  return { success: true };
}

export async function toggleShiftProp(shiftId: string, prop: "isPihenonap" | "isBehivas") {
  const session = await auth();
  if (!session?.user?.id) return { error: "Nem vagy bejelentkezve" };

  const [shift] = await db
    .select()
    .from(shifts)
    .where(and(eq(shifts.id, shiftId), eq(shifts.userId, session.user.id)))
    .limit(1);

  if (!shift) return { error: "Műszak nem található" };

  await db
    .update(shifts)
    .set({ [prop]: !shift[prop] })
    .where(eq(shifts.id, shiftId));

  revalidatePath("/shifts");
  revalidatePath("/dashboard");
  revalidatePath("/payroll");
  return { success: true };
}

export async function deleteAllMonthShifts(year: number, month: number) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Nem vagy bejelentkezve" };

  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);

  await db
    .delete(shifts)
    .where(
      and(
        eq(shifts.userId, session.user.id),
        gte(shifts.startTime, start),
        lt(shifts.startTime, end)
      )
    );

  revalidatePath("/shifts");
  revalidatePath("/dashboard");
  revalidatePath("/payroll");
  return { success: true };
}
