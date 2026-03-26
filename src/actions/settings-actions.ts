"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { userSettings } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function updateSettings(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Nem vagy bejelentkezve" };

  const illetmeny = Number(formData.get("illetmeny"));
  const hoursPerDay = Number(formData.get("hoursPerDay"));
  const selectedBer = Number(formData.get("selectedBer"));

  if (isNaN(illetmeny) || isNaN(hoursPerDay) || isNaN(selectedBer)) {
    return { error: "Érvénytelen adatok" };
  }

  await db
    .update(userSettings)
    .set({
      illetmeny,
      hoursPerDay: String(hoursPerDay),
      selectedBer,
      updatedAt: new Date(),
    })
    .where(eq(userSettings.userId, session.user.id));

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/payroll");
  return { success: true };
}
