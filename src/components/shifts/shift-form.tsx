"use client";

import { useState, useTransition, useMemo } from "react";
import { createShift, updateShift } from "@/actions/shift-actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import type { ShiftData } from "@/lib/calculations/constants";

interface Props {
  year: number;
  month: number;
  holidays?: string[];
  onSuccess: () => void;
  editShift?: ShiftData;
}

/** Count how many hours of a shift fall on holiday dates */
function countHolidayHours(
  startStr: string,
  endStr: string,
  holidaySet: Set<string>
): number {
  const s = new Date(startStr);
  const e = new Date(endStr);
  if (isNaN(s.getTime()) || isNaN(e.getTime()) || e <= s) return 0;

  let hours = 0;
  let cur = new Date(s.getTime());
  while (cur < e) {
    const next = new Date(Math.min(cur.getTime() + 3600000, e.getTime()));
    const frac = (next.getTime() - cur.getTime()) / 3600000;
    const ds = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`;
    if (holidaySet.has(ds)) hours += frac;
    cur = next;
  }
  return hours;
}

export function ShiftForm({ year, month, holidays = [], onSuccess, editShift }: Props) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const now = new Date();
  const dim = new Date(year, month + 1, 0).getDate();
  const day = Math.min(now.getDate(), dim);

  const defaultStart = editShift
    ? editShift.start.slice(0, 16)
    : `${year}-${pad(month + 1)}-${pad(day)}T08:00`;

  const defaultEnd = editShift
    ? editShift.end.slice(0, 16)
    : "";

  const [startTime, setStartTime] = useState(defaultStart);
  const [endTime, setEndTime] = useState(defaultEnd);
  const [isBehivas, setIsBehivas] = useState(editShift?.behivas ?? false);
  const [pending, startTransition] = useTransition();

  const holidaySet = useMemo(() => new Set(holidays), [holidays]);

  const setDuration = (h: number) => {
    if (!startTime) return;
    const s = new Date(startTime);
    s.setHours(s.getHours() + h);
    const pad2 = (n: number) => String(n).padStart(2, "0");
    setEndTime(
      `${s.getFullYear()}-${pad2(s.getMonth() + 1)}-${pad2(s.getDate())}T${pad2(s.getHours())}:${pad2(s.getMinutes())}`
    );
  };

  const isValid =
    startTime && endTime && new Date(endTime) > new Date(startTime);

  const hours = isValid
    ? (new Date(endTime).getTime() - new Date(startTime).getTime()) / 3600000
    : 0;

  const holidayHours = isValid ? countHolidayHours(startTime, endTime, holidaySet) : 0;

  const handleSubmit = () => {
    if (!isValid) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("startTime", startTime);
      fd.set("endTime", endTime);
      fd.set("isBehivas", String(isBehivas));

      const result = editShift
        ? await updateShift(editShift.id, fd)
        : await createShift(fd);

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(editShift ? "Műszak módosítva" : "Műszak hozzáadva");
        if (!editShift) {
          const nd = new Date(startTime);
          nd.setDate(nd.getDate() + 7);
          setStartTime(
            `${nd.getFullYear()}-${pad(nd.getMonth() + 1)}-${pad(nd.getDate())}T08:00`
          );
          setEndTime("");
          setIsBehivas(false);
        }
        onSuccess();
      }
    });
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Kezdés</Label>
            <div className="overflow-hidden rounded-lg border border-input">
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  setEndTime("");
                }}
                className="w-full bg-transparent px-2.5 py-1.5 text-sm outline-none"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Vége</Label>
            <div className="overflow-hidden rounded-lg border border-input">
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-transparent px-2.5 py-1.5 text-sm outline-none"
              />
            </div>
          </div>
        </div>

        {/* Quick duration */}
        <div className="flex flex-wrap gap-2">
          {[4, 6, 8, 10, 12, 14, 16, 18, 24].map((h) => (
            <Button
              key={h}
              variant="outline"
              size="sm"
              className="flex-1 min-w-[3rem] text-xs"
              onClick={() => setDuration(h)}
            >
              {h}h
            </Button>
          ))}
        </div>

        {isValid && (
          <p className="text-xs text-center text-muted-foreground">
            {hours.toFixed(1)} óra
            {holidayHours > 0 && (
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                {" "}— {holidayHours.toFixed(holidayHours % 1 === 0 ? 0 : 1)}h ünnep
              </span>
            )}
          </p>
        )}

        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <Switch
              checked={isBehivas}
              onCheckedChange={setIsBehivas}
            />
            <Label className="text-xs">Behívás</Label>
          </div>
        </div>

        <Button
          className="w-full"
          disabled={!isValid || pending}
          onClick={handleSubmit}
        >
          {pending ? "Mentés..." : editShift ? "Mentés" : "Hozzáadás"}
        </Button>
      </CardContent>
    </Card>
  );
}
