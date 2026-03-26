"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { kedvezmenyMap } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function toggleKedvezmeny(
  year: number,
  month: number,
  kedvezmenyes: boolean
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Nem vagy bejelentkezve" };

  const [existing] = await db
    .select()
    .from(kedvezmenyMap)
    .where(
      and(
        eq(kedvezmenyMap.userId, session.user.id),
        eq(kedvezmenyMap.year, year),
        eq(kedvezmenyMap.month, month)
      )
    )
    .limit(1);

  if (existing) {
    await db
      .update(kedvezmenyMap)
      .set({ kedvezmenyes })
      .where(eq(kedvezmenyMap.id, existing.id));
  } else {
    await db.insert(kedvezmenyMap).values({
      userId: session.user.id,
      year,
      month,
      kedvezmenyes,
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/payroll");
  return { success: true };
}
