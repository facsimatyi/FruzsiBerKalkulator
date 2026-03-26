"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LayoutDashboard, Clock, Calculator, Coins, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Főoldal", icon: LayoutDashboard },
  { href: "/shifts", label: "Műszakok", icon: Clock },
  { href: "/payroll", label: "Bérszám", icon: Calculator },
  { href: "/potlekok", label: "Pótlékok", icon: Coins },
  { href: "/settings", label: "Beáll.", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Preserve year/month params across navigation
  const monthParams = new URLSearchParams();
  const year = searchParams.get("year");
  const month = searchParams.get("month");
  if (year) monthParams.set("year", year);
  if (month) monthParams.set("month", month);
  const qs = monthParams.toString();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border md:hidden">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const href = qs ? `${item.href}?${qs}` : item.href;
          return (
            <Link
              key={item.href}
              href={href}
              prefetch={true}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors min-w-[56px] active:scale-95",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
