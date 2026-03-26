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
  calc: MonthCalcResult;
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
  calc,
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

      {/* Pótlék bontás */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm">Pótlék bontás</CardTitle>
            <span className="text-sm font-semibold tabular-nums">
              {fmt(calc.potlekTotal)} Ft
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Napszak (minden órára)
          </p>
          <Row
            label="Normál 06–14"
            value={`${calc.napszakH.normal.toFixed(1)}h`}
            sub
          />
          <Row
            label="Délutáni 14–22 (20%)"
            value={`${calc.napszakH.delutan.toFixed(1)}h → ${fmt(calc.delutanPotlek)} Ft`}
            sub
          />
          <Row
            label="Éjszakai 22–06 (50%)"
            value={`${calc.napszakH.ejszaka.toFixed(1)}h → ${fmt(calc.ejszakaPotlek)} Ft`}
            sub
          />
          <Row
            label="Napszak pótlék"
            value={`${fmt(calc.napszakTotal)} Ft`}
            bold
          />

          <Separator className="my-2" />

          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Rendkívüli (ráadásul)
          </p>
          <Row
            label="Ünnepnap (+150%)"
            value={`${calc.unnepH.toFixed(1)}h → ${fmt(calc.unnepPotlek)} Ft`}
            sub
          />
          <Row
            label="Hétvége (+100%)"
            value={`${calc.hetvegeH.toFixed(1)}h → ${fmt(calc.hetvegePotlek)} Ft`}
            sub
          />
          <Row
            label="Pihenőnap (+100%)"
            value={`${calc.pihenoH.toFixed(1)}h → ${fmt(calc.pihenoPotlek)} Ft`}
            sub
          />
          <Row
            label="Túlóra (+150%)"
            value={`${calc.tuloraH.toFixed(1)}h → ${fmt(calc.tuloraPotlek)} Ft`}
            sub
          />
          <Row
            label="Behívás (+200%)"
            value={`${calc.behivasH.toFixed(1)}h → ${fmt(calc.behivasPotlek)} Ft`}
            sub
          />
          <Row
            label="Rendkívüli pótlék"
            value={`${fmt(calc.rendkivuliTotal)} Ft`}
            bold
          />

          <Separator className="my-2" />
          <Row
            label="Összes pótlék"
            value={`${fmt(calc.potlekTotal)} Ft`}
            bold
          />
        </CardContent>
      </Card>

      {/* Bérszámfejtés */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Bérszámfejtés</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <Row label="Illetmény" value={`${fmt(illetmeny)} Ft`} />
          <Row
            label={`Előző havi pótlékok (${MHU[prevM]})`}
            value={`${fmt(prevCalc.potlekTotal)} Ft`}
          />
          <Row label="Bruttó" value={`${fmt(thisBrutto)} Ft`} bold />
          <Separator className="my-2" />
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
                  ? "SZJA (kedvezményes)"
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
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            Köv. hó becslés — {MFULL[nextMonth]}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="text-xs text-muted-foreground mb-2">
            {MFULL[month]}i pótlékok csúsztatva → {fmt(calc.potlekTotal)} Ft
          </p>
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
          <p className="text-[10px] text-muted-foreground mt-2">
            Teljes havi illetménnyel, hiányzás nélkül
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
