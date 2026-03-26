"use client";

import { MonthSelector } from "@/components/shared/month-selector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MHU, MFULL, fmt, type MonthCalcResult } from "@/lib/calculations/constants";

interface RowProps {
  label: string;
  value: string;
  bold?: boolean;
  danger?: boolean;
  success?: boolean;
  sub?: boolean;
}

function Row({ label, value, bold, danger, success, sub }: RowProps) {
  return (
    <div className="flex justify-between items-baseline py-0.5 text-sm">
      <span
        className={`${sub ? "text-xs text-muted-foreground" : ""} ${
          bold ? "font-semibold" : ""
        }`}
      >
        {label}
      </span>
      <span
        className={`tabular-nums ${bold ? "font-semibold" : "font-medium"} ${
          danger ? "text-red-600 dark:text-red-400" : ""
        } ${success ? "text-green-600 dark:text-green-400" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

interface Props {
  year: number;
  month: number;
  prevCalc: MonthCalcResult;
  illetmeny: number;
  thisKedv: boolean;
  thisBrutto: number;
  thisTb: number;
  thisSzja: number;
  thisNetto: number;
  nextBrutto: number;
  nextTb: number;
  nextSzja: number;
  nextNetto: number;
  nextMonth: number;
}

export function PayrollContent({
  year,
  month,
  prevCalc,
  illetmeny,
  thisKedv,
  thisBrutto,
  thisTb,
  thisSzja,
  thisNetto,
  nextBrutto,
  nextTb,
  nextSzja,
  nextNetto,
  nextMonth,
}: Props) {
  const prevM = month === 0 ? 11 : month - 1;

  return (
    <div className="space-y-4">
      <MonthSelector />

      {/* Nettó hero */}
      <div className="text-center space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {year}. {MFULL[month]} — bérszám
        </p>
        <p className="text-4xl font-bold tracking-tight tabular-nums">
          {fmt(thisNetto)}{" "}
          <span className="text-lg font-medium text-muted-foreground">Ft</span>
        </p>
      </div>

      {/* Bérszámfejtés: illetmény + előző havi pótlékok */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Bérszámfejtés</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <Row label="Illetmény" value={`${fmt(illetmeny)} Ft`} />

          <Separator className="my-2" />

          {/* Előző havi pótlékok bontása */}
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pb-1">
            {MFULL[prevM]}i pótlékok (csúsztatva)
          </p>

          {prevCalc.delutanPotlek > 0 && (
            <Row
              label={`Délutáni 20% (${prevCalc.napszakH.delutan.toFixed(1)}h)`}
              value={`${fmt(prevCalc.delutanPotlek)} Ft`}
              sub
            />
          )}
          {prevCalc.ejszakaPotlek > 0 && (
            <Row
              label={`Éjszakai 50% (${prevCalc.napszakH.ejszaka.toFixed(1)}h)`}
              value={`${fmt(prevCalc.ejszakaPotlek)} Ft`}
              sub
            />
          )}
          {prevCalc.unnepPotlek > 0 && (
            <Row
              label={`Ünnepnap 150% (${prevCalc.unnepH.toFixed(1)}h)`}
              value={`${fmt(prevCalc.unnepPotlek)} Ft`}
              sub
            />
          )}
          {prevCalc.tuloraPotlek > 0 && (
            <Row
              label={`Túlóra 150% (${prevCalc.tuloraH.toFixed(1)}h)`}
              value={`${fmt(prevCalc.tuloraPotlek)} Ft`}
              sub
            />
          )}
          {prevCalc.hetvegePotlek > 0 && (
            <Row
              label={`Hétvége 100% (${prevCalc.hetvegeH.toFixed(1)}h)`}
              value={`${fmt(prevCalc.hetvegePotlek)} Ft`}
              sub
            />
          )}
          {prevCalc.pihenoPotlek > 0 && (
            <Row
              label={`Pihenőnap 100% (${prevCalc.pihenoH.toFixed(1)}h)`}
              value={`${fmt(prevCalc.pihenoPotlek)} Ft`}
              sub
            />
          )}
          {prevCalc.behivasPotlek > 0 && (
            <Row
              label={`Behívás 200% (${prevCalc.behivasH.toFixed(1)}h)`}
              value={`${fmt(prevCalc.behivasPotlek)} Ft`}
              sub
            />
          )}

          <Row
            label={`Pótlékok összesen`}
            value={`${fmt(prevCalc.potlekTotal)} Ft`}
            bold
          />

          <Separator className="my-2" />

          <Row label="Bruttó" value={`${fmt(thisBrutto)} Ft`} bold />

          <Separator className="my-2" />

          {/* Levonások */}
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pb-1">
            Levonások
          </p>
          <Row
            label="TB illetményre (18,5%)"
            value={`−${fmt(Math.round(illetmeny * 0.185))} Ft`}
            danger
          />
          <Row
            label="TB pótlékokra (18,5%)"
            value={`−${fmt(Math.round(prevCalc.potlekTotal * 0.185))} Ft`}
            danger
          />
          <Row
            label={
              thisKedv
                ? thisSzja === 0
                  ? "SZJA (25 alatti kedv.)"
                  : "SZJA plafon felett"
                : "SZJA (15%)"
            }
            value={thisSzja === 0 ? "0 Ft" : `−${fmt(thisSzja)} Ft`}
            danger={thisSzja > 0}
            success={thisSzja === 0}
          />

          <Separator className="my-2" />

          <Row label="Nettó" value={`${fmt(thisNetto)} Ft`} bold success />
        </CardContent>
      </Card>

      {/* Köv. hó becslés */}
      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            Köv. hó becslés — {MFULL[nextMonth]}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <Row label="Bruttó" value={`${fmt(nextBrutto)} Ft`} />
          <Row label="TB (18,5%)" value={`−${fmt(nextTb)} Ft`} danger />
          {nextSzja > 0 && (
            <Row label="SZJA" value={`−${fmt(nextSzja)} Ft`} danger />
          )}
          <Separator className="my-2" />
          <Row
            label="Becsült nettó"
            value={`${fmt(nextNetto)} Ft`}
            bold
            success
          />
        </CardContent>
      </Card>
    </div>
  );
}
