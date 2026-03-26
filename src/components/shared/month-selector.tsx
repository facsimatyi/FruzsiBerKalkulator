"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MHU, MFULL } from "@/lib/calculations/constants";
import { cn } from "@/lib/utils";
import { useCallback } from "react";

export function useMonthParams() {
  const searchParams = useSearchParams();
  const now = new Date();
  const year = Number(searchParams.get("year")) || now.getFullYear();
  const month = Number(searchParams.get("month") ?? now.getMonth());
  return { year, month };
}

export function MonthSelector() {
  const router = useRouter();
  const { year, month } = useMonthParams();

  const go = useCallback(
    (y: number, m: number) => {
      router.push(`?year=${y}&month=${m}`, { scroll: false });
    },
    [router]
  );

  const prevNav = () => {
    if (month === 0) {
      if (year > 2024) go(year - 1, 11);
    } else go(year, month - 1);
  };

  const nextNav = () => {
    if (month === 11) go(year + 1, 0);
    else go(year, month + 1);
  };

  return (
    <div className="space-y-3">
      {/* Year pills */}
      <div className="flex gap-1 justify-center">
        {[2024, 2025, 2026].map((y) => (
          <button
            key={y}
            onClick={() => go(y, month)}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded-full transition-colors",
              y === year
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {y}
          </button>
        ))}
      </div>

      {/* Month strip */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={prevNav}
          disabled={year === 2024 && month === 0}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex gap-0.5 flex-1 overflow-x-auto scrollbar-none">
          {MHU.map((m, i) => (
            <button
              key={i}
              onClick={() => go(year, i)}
              className={cn(
                "px-1.5 py-1 min-w-[28px] text-[11px] rounded-md transition-colors shrink-0",
                i === month
                  ? "bg-primary/10 text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {m}
            </button>
          ))}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={nextNav}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Title */}
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {year}. {MFULL[month]}
        </p>
      </div>
    </div>
  );
}
