"use client";

import { useState, useTransition } from "react";
import { updateSettings, upsertSettingsPeriod, deleteSettingsPeriod } from "@/actions/settings-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BERTABLA, MFULL, fmt } from "@/lib/calculations/constants";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import type { SettingsPeriod } from "@/db/schema";

interface Props {
  illetmeny: number;
  hoursPerDay: number;
  selectedBer: number;
  periods: SettingsPeriod[];
}

export function SettingsContent({
  illetmeny: initIlletmeny,
  hoursPerDay: initHours,
  selectedBer: initBer,
  periods: initPeriods,
}: Props) {
  const [illetmeny, setIlletmeny] = useState(initIlletmeny);
  const [hoursPerDay, setHoursPerDay] = useState(initHours);
  const [selectedBer, setSelectedBer] = useState(initBer);
  const [pending, startTransition] = useTransition();
  const [showAddPeriod, setShowAddPeriod] = useState(false);
  const [newYear, setNewYear] = useState(new Date().getFullYear());
  const [newMonth, setNewMonth] = useState(new Date().getMonth());
  const [newIlletmeny, setNewIlletmeny] = useState(initIlletmeny);
  const [newHours, setNewHours] = useState(initHours);

  const orabér = illetmeny / ((174 * hoursPerDay) / 8);

  const save = (il: number, hpd: number, sb: number) => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("illetmeny", String(il));
      fd.set("hoursPerDay", String(hpd));
      fd.set("selectedBer", String(sb));
      const result = await updateSettings(fd);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Beállítások mentve");
      }
    });
  };

  const addPeriod = () => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("effectiveYear", String(newYear));
      fd.set("effectiveMonth", String(newMonth));
      fd.set("illetmeny", String(newIlletmeny));
      fd.set("hoursPerDay", String(newHours));
      fd.set("selectedBer", "-1");
      const result = await upsertSettingsPeriod(fd);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Időszak mentve");
        setShowAddPeriod(false);
      }
    });
  };

  const removePeriod = (id: string) => {
    startTransition(async () => {
      const result = await deleteSettingsPeriod(id);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Időszak törölve");
      }
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Beállítások</h2>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Bértábla sáv</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <select
            value={selectedBer}
            onChange={(e) => {
              const i = +e.target.value;
              setSelectedBer(i);
              if (i >= 0) {
                const newIl = Math.round(BERTABLA[i].min * (hoursPerDay / 8));
                setIlletmeny(newIl);
                save(newIl, hoursPerDay, i);
              }
            }}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
          >
            <option value={-1}>Egyéni összeg</option>
            {BERTABLA.map((b, i) => (
              <option key={i} value={i}>
                {b.label}: {fmt(b.min)}–{fmt(b.max)}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Illetmény és munkaidő</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Bruttó illetmény (Ft)</Label>
              <Input
                type="number"
                value={illetmeny}
                onChange={(e) => {
                  const v = +e.target.value;
                  setIlletmeny(v);
                  setSelectedBer(-1);
                }}
                onBlur={() => save(illetmeny, hoursPerDay, -1)}
                className="text-sm tabular-nums"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Napi óra</Label>
              <Input
                type="number"
                step="0.5"
                value={hoursPerDay}
                onChange={(e) => setHoursPerDay(+e.target.value)}
                onBlur={() => save(illetmeny, hoursPerDay, selectedBer)}
                className="text-sm tabular-nums"
              />
            </div>
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>
              Órabér:{" "}
              <strong className="text-foreground">{fmt(orabér)} Ft</strong>
            </span>
            <span>
              FTE:{" "}
              <strong className="text-foreground">
                {fmt(Math.round(illetmeny / (hoursPerDay / 8)))} Ft
              </strong>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Settings Periods */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm">Beállítás-előzmények</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setShowAddPeriod(!showAddPeriod)}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Új időszak
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Ha változott az illetményed vagy az óraszámod, adj hozzá egy új időszakot.
            A kalkulátor az adott hónapra érvényes beállítást fogja használni.
          </p>

          {showAddPeriod && (
            <div className="p-3 rounded-lg border border-dashed border-primary/30 bg-primary/5 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Év</Label>
                  <select
                    value={newYear}
                    onChange={(e) => setNewYear(+e.target.value)}
                    className="w-full px-2 py-1.5 rounded-md border border-border bg-background text-sm"
                  >
                    {[2024, 2025, 2026].map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Hónap (ettől érvényes)</Label>
                  <select
                    value={newMonth}
                    onChange={(e) => setNewMonth(+e.target.value)}
                    className="w-full px-2 py-1.5 rounded-md border border-border bg-background text-sm"
                  >
                    {MFULL.map((m, i) => (
                      <option key={i} value={i}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Illetmény (Ft)</Label>
                  <Input
                    type="number"
                    value={newIlletmeny}
                    onChange={(e) => setNewIlletmeny(+e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Napi óra</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={newHours}
                    onChange={(e) => setNewHours(+e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="text-xs" onClick={addPeriod} disabled={pending}>
                  Mentés
                </Button>
                <Button size="sm" variant="ghost" className="text-xs" onClick={() => setShowAddPeriod(false)}>
                  Mégsem
                </Button>
              </div>
            </div>
          )}

          {initPeriods.length > 0 ? (
            <div className="space-y-2">
              {initPeriods.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50"
                >
                  <div>
                    <span className="text-sm font-medium">
                      {p.effectiveYear}. {MFULL[p.effectiveMonth]}–tól
                    </span>
                    <div className="text-xs text-muted-foreground">
                      {fmt(p.illetmeny)} Ft • {Number(p.hoursPerDay)} óra/nap
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removePeriod(p.id)}
                    disabled={pending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              Nincs beállítás-előzmény. A fenti értékek minden hónapra érvényesek.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
