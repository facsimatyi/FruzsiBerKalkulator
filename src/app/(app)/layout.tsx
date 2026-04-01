import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserSettings } from "@/lib/queries";
import { AppHeader } from "@/components/layout/app-header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { ensureUserHasHolidays } from "@/actions/holiday-actions";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const settings = await getUserSettings(session.user.id);
  const needsOnboarding = !settings || settings.illetmeny === 0;

  // Auto-seed holidays for users who don't have any yet
  await ensureUserHasHolidays(session.user.id);

  if (needsOnboarding) {
    return <OnboardingForm />;
  }

  return (
    <div className="flex flex-col h-screen">
      <AppHeader userName={session.user?.name ?? undefined} />
      <div className="flex flex-1 overflow-hidden">
        <DesktopSidebar />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-4">
          <div className="max-w-2xl mx-auto px-4 py-4">{children}</div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
