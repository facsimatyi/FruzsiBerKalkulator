"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LayoutDashboard, Clock, Calculator, Coins, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Főoldal", icon: LayoutDashboard },
  { href: "/shifts", label: "Műszakok", icon: Clock },
  { href: "/payroll", label: "Bérszámfejtés", icon: Calculator },
  { href: "/potlekok", label: "Pótlékok", icon: Coins },
  { href: "/settings", label: "Beállítások", icon: Settings },
];

export function DesktopSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const monthParams = new URLSearchParams();
  const year = searchParams.get("year");
  const month = searchParams.get("month");
  if (year) monthParams.set("year", year);
  if (month) monthParams.set("month", month);
  const qs = monthParams.toString();

  return (
    <aside className="hidden md:flex flex-col w-56 border-r border-border bg-background p-4 gap-1">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        const href = qs ? `${item.href}?${qs}` : item.href;
        return (
          <Link
            key={item.href}
            href={href}
            prefetch={true}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </aside>
  );
}
