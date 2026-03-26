import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserSettings, getSettingsPeriods } from "@/lib/queries";
import { SettingsContent } from "@/components/settings/settings-content";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [settings, periods] = await Promise.all([
    getUserSettings(session.user.id),
    getSettingsPeriods(session.user.id),
  ]);

  return (
    <SettingsContent
      illetmeny={settings?.illetmeny ?? 457500}
      hoursPerDay={Number(settings?.hoursPerDay ?? 6)}
      selectedBer={settings?.selectedBer ?? -1}
      periods={periods}
      birthDate={settings?.birthDate ?? null}
    />
  );
}
