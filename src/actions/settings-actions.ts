"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { userSettings, settingsPeriods } from "@/db/schema";
import { auth } from "@/lib/auth";

/** Parse number handling Hungarian comma decimal (3,85 → 3.85) */
function parseNum(val: FormDataEntryValue | null): number {
  return Number(String(val ?? "").replace(",", "."));
}

export async function updateSettings(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Nem vagy bejelentkezve" };

  const illetmeny = parseNum(formData.get("illetmeny"));
  const hoursPerDay = parseNum(formData.get("hoursPerDay"));
  const selectedBer = parseNum(formData.get("selectedBer"));

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

export async function upsertSettingsPeriod(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Nem vagy bejelentkezve" };

  const effectiveYear = parseNum(formData.get("effectiveYear"));
  const effectiveMonth = parseNum(formData.get("effectiveMonth"));
  const illetmeny = parseNum(formData.get("illetmeny"));
  const hoursPerDay = parseNum(formData.get("hoursPerDay"));
  const selectedBer = parseNum(formData.get("selectedBer"));

  if (isNaN(effectiveYear) || isNaN(effectiveMonth) || isNaN(illetmeny) || isNaN(hoursPerDay)) {
    return { error: "Érvénytelen adatok" };
  }

  // Upsert: insert or update if exists for this user+year+month
  const [existing] = await db
    .select()
    .from(settingsPeriods)
    .where(
      and(
        eq(settingsPeriods.userId, session.user.id),
        eq(settingsPeriods.effectiveYear, effectiveYear),
        eq(settingsPeriods.effectiveMonth, effectiveMonth)
      )
    )
    .limit(1);

  if (existing) {
    await db
      .update(settingsPeriods)
      .set({ illetmeny, hoursPerDay: String(hoursPerDay), selectedBer })
      .where(eq(settingsPeriods.id, existing.id));
  } else {
    await db.insert(settingsPeriods).values({
      userId: session.user.id,
      effectiveYear,
      effectiveMonth,
      illetmeny,
      hoursPerDay: String(hoursPerDay),
      selectedBer,
    });
  }

  // Also update user_settings to reflect the latest period
  await db
    .update(userSettings)
    .set({ illetmeny, hoursPerDay: String(hoursPerDay), selectedBer, updatedAt: new Date() })
    .where(eq(userSettings.userId, session.user.id));

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/payroll");
  return { success: true };
}

export async function deleteSettingsPeriod(periodId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Nem vagy bejelentkezve" };

  // Verify ownership
  const [period] = await db
    .select()
    .from(settingsPeriods)
    .where(
      and(eq(settingsPeriods.id, periodId), eq(settingsPeriods.userId, session.user.id))
    )
    .limit(1);

  if (!period) return { error: "Időszak nem található" };

  await db.delete(settingsPeriods).where(eq(settingsPeriods.id, periodId));

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/payroll");
  return { success: true };
}
