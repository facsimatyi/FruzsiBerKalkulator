import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserSettings } from "@/lib/queries";
import { SettingsContent } from "@/components/settings/settings-content";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const settings = await getUserSettings(session.user.id);

  return (
    <SettingsContent
      illetmeny={settings?.illetmeny ?? 457500}
      hoursPerDay={Number(settings?.hoursPerDay ?? 6)}
      selectedBer={settings?.selectedBer ?? -1}
    />
  );
}
