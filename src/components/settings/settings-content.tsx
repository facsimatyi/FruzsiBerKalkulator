"use client";

import { useState, useTransition } from "react";
import { updateSettings } from "@/actions/settings-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BERTABLA, fmt } from "@/lib/calculations/constants";
import { toast } from "sonner";

interface Props {
  illetmeny: number;
  hoursPerDay: number;
  selectedBer: number;
}

export function SettingsContent({ illetmeny: initIlletmeny, hoursPerDay: initHours, selectedBer: initBer }: Props) {
  const [illetmeny, setIlletmeny] = useState(initIlletmeny);
  const [hoursPerDay, setHoursPerDay] = useState(initHours);
  const [selectedBer, setSelectedBer] = useState(initBer);
  const [pending, startTransition] = useTransition();

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
    </div>
  );
}
