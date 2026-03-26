"use client";

import { MonthSelector } from "@/components/shared/month-selector";
import { Card, CardContent } from "@/components/ui/card";
import { MFULL, fmt, type MonthCalcResult } from "@/lib/calculations/constants";
import { Clock, TrendingUp, Wallet, DollarSign } from "lucide-react";
import { toggleKedvezmeny } from "@/actions/kedvezmeny-actions";
import { cn } from "@/lib/utils";

interface Props {
  year: number;
  month: number;
  calc: MonthCalcResult;
  thisNetto: number;
  thisBrutto: number;
  thisTb: number;
  thisSzja: number;
  thisKedv: boolean;
  progressPct: number;
  nextMonth: number;
}

export function DashboardContent({
  year,
  month,
  calc,
  thisNetto,
  thisBrutto,
  thisTb,
  thisSzja,
  thisKedv,
  progressPct,
  nextMonth,
}: Props) {
  return (
    <div className="space-y-6">
      <MonthSelector />

      {/* Hero: Nettó — ez az adott hónap bérszáma, ami a köv. hónap elején érkezik */}
      <div className="text-center space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {MFULL[nextMonth]} elején várható nettó
        </p>
        <p className="text-4xl font-bold tracking-tight tabular-nums">
          {fmt(thisNetto)}{" "}
          <span className="text-lg font-medium text-muted-foreground">Ft</span>
        </p>
        <p className="text-xs text-muted-foreground">
          {MFULL[month]}i bérszám • bruttó {fmt(thisBrutto)} • TB −{fmt(thisTb)}
          {thisSzja > 0 ? ` • SZJA −${fmt(thisSzja)}` : ""}
        </p>
      </div>

      {/* SZJA toggle */}
      <div className="flex gap-2 justify-center">
        <button
          onClick={() => toggleKedvezmeny(year, month, true)}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-full transition-colors",
            thisKedv
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          25 alatti kedv.
        </button>
        <button
          onClick={() => toggleKedvezmeny(year, month, false)}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-full transition-colors",
            !thisKedv
              ? "bg-destructive/10 text-destructive"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Teljes SZJA
        </button>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">
            {calc.totalH.toFixed(1)}h / {calc.kotelesOrak.toFixed(1)}h kötelező
          </span>
          <span
            className={cn(
              "font-semibold",
              calc.totalH >= calc.kotelesOrak
                ? "text-green-600"
                : calc.totalH > 0
                ? "text-amber-600"
                : "text-muted-foreground"
            )}
          >
            {calc.totalH > calc.kotelesOrak
              ? `+${(calc.totalH - calc.kotelesOrak).toFixed(1)}h túlóra`
              : calc.totalH > 0
              ? `${(calc.kotelesOrak - calc.totalH).toFixed(1)}h hátra`
              : "—"}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              progressPct >= 100
                ? "bg-green-500"
                : progressPct > 0
                ? "bg-amber-500"
                : ""
            )}
            style={{ width: `${Math.min(progressPct, 100)}%` }}
          />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Műszakok</span>
            </div>
            <p className="text-2xl font-bold tabular-nums">
              {calc.monthShifts.length}
            </p>
            <p className="text-xs text-muted-foreground">
              {calc.totalH.toFixed(0)} óra
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Pótlékok</span>
            </div>
            <p className="text-2xl font-bold tabular-nums">
              {fmt(calc.potlekTotal)}
            </p>
            <p className="text-xs text-muted-foreground">Ft összesen</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Napszak</span>
            </div>
            <p className="text-lg font-bold tabular-nums">
              {fmt(calc.napszakTotal)} Ft
            </p>
            <p className="text-xs text-muted-foreground">
              DU {calc.napszakH.delutan.toFixed(0)}h • Éj{" "}
              {calc.napszakH.ejszaka.toFixed(0)}h
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Wallet className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Rendkívüli</span>
            </div>
            <p className="text-lg font-bold tabular-nums">
              {fmt(calc.rendkivuliTotal)} Ft
            </p>
            <p className="text-xs text-muted-foreground">
              {calc.unnepH > 0 ? `Ünnep ${calc.unnepH.toFixed(0)}h ` : ""}
              {calc.hetvegeH > 0 ? `Hétvége ${calc.hetvegeH.toFixed(0)}h ` : ""}
              {calc.tuloraH > 0 ? `Túlóra ${calc.tuloraH.toFixed(0)}h` : ""}
              {calc.unnepH === 0 && calc.hetvegeH === 0 && calc.tuloraH === 0 ? "—" : ""}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
