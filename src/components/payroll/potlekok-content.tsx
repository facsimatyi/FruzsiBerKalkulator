"use client";

import { MonthSelector } from "@/components/shared/month-selector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MFULL, fmt, fmtH, type MonthCalcResult } from "@/lib/calculations/constants";

interface RowProps {
  label: string;
  value: string;
  bold?: boolean;
  sub?: boolean;
}

function Row({ label, value, bold, sub }: RowProps) {
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
        className={`tabular-nums ${bold ? "font-semibold" : "font-medium"}`}
      >
        {value}
      </span>
    </div>
  );
}

interface Props {
  year: number;
  month: number;
  calc: MonthCalcResult;
  orabér: number;
}

export function PotlekokContent({ year, month, calc, orabér }: Props) {
  const nextM = (month + 1) % 12;
  const nextY = month === 11 ? year + 1 : year;

  return (
    <div className="space-y-4">
      <MonthSelector />

      {/* Header */}
      <div className="text-center space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {year}. {MFULL[month]} — pótlékok
        </p>
        <p className="text-3xl font-bold tracking-tight tabular-nums">
          {fmt(calc.potlekTotal)}{" "}
          <span className="text-base font-medium text-muted-foreground">Ft</span>
        </p>
        <p className="text-xs text-muted-foreground">
          {calc.totalH.toFixed(0)} óra • órabér {fmt(orabér)} Ft
          {" • "}megjelenik {MFULL[nextM]}i bérszámon
        </p>
      </div>

      {/* Napszak pótlékok */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm">Napszak pótlékok</CardTitle>
            <span className="text-sm font-semibold tabular-nums">
              {fmt(calc.napszakTotal)} Ft
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          <Row
            label="Normál 06–14"
            value={`${fmtH(calc.napszakH.normal)}h`}
            sub
          />
          <Row
            label="Délutáni 14–22 (20%)"
            value={`${fmtH(calc.napszakH.delutan)}h → ${fmt(calc.delutanPotlek)} Ft`}
            sub
          />
          <Row
            label="Éjszakai 22–06 (50%)"
            value={`${fmtH(calc.napszakH.ejszaka)}h → ${fmt(calc.ejszakaPotlek)} Ft`}
            sub
          />
          <Separator className="my-2" />
          <Row
            label="Napszak összesen"
            value={`${fmt(calc.napszakTotal)} Ft`}
            bold
          />
        </CardContent>
      </Card>

      {/* Rendkívüli pótlékok */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm">Rendkívüli pótlékok</CardTitle>
            <span className="text-sm font-semibold tabular-nums">
              {fmt(calc.rendkivuliTotal)} Ft
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          <Row
            label="Ünnepnap (+100%)"
            value={`${fmtH(calc.unnepH)}h → ${fmt(calc.unnepPotlek)} Ft`}
            sub
          />
          <Row
            label="Hétvége (+100%)"
            value={`${fmtH(calc.hetvegeH)}h → ${fmt(calc.hetvegePotlek)} Ft`}
            sub
          />
          <Row
            label="Pihenőnap (+100%)"
            value={`${fmtH(calc.pihenoH)}h → ${fmt(calc.pihenoPotlek)} Ft`}
            sub
          />
          <Row
            label="Túlóra (+150%)"
            value={`${fmtH(calc.tuloraH)}h → ${fmt(calc.tuloraPotlek)} Ft`}
            sub
          />
          <Row
            label="Behívás (+200%)"
            value={`${fmtH(calc.behivasH)}h → ${fmt(calc.behivasPotlek)} Ft`}
            sub
          />
          <Separator className="my-2" />
          <Row
            label="Rendkívüli összesen"
            value={`${fmt(calc.rendkivuliTotal)} Ft`}
            bold
          />
        </CardContent>
      </Card>

      {/* Órák összesítő */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Órák összesítő</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <Row label="Ledolgozott" value={`${fmtH(calc.totalH)}h`} />
          <Row label="Kötelező" value={`${fmtH(calc.kotelesOrak)}h`} />
          <Row
            label="Munkanapok"
            value={`${calc.munkaNapok} nap`}
          />
          <Separator className="my-2" />
          <Row
            label="Összes pótlék"
            value={`${fmt(calc.potlekTotal)} Ft`}
            bold
          />
        </CardContent>
      </Card>
    </div>
  );
}
