import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

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
