"use client";

import { useTransition } from "react";
import { deleteShift, toggleShiftProp } from "@/actions/shift-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { toast } from "sonner";
import { DN } from "@/lib/calculations/constants";
import { dateStr } from "@/lib/calculations/holidays";
import type { ShiftData } from "@/lib/calculations/constants";

interface Props {
  shift: ShiftData;
  holidays: Set<string>;
}

export function ShiftCard({ shift, holidays }: Props) {
  const [pending, startTransition] = useTransition();
  const s = new Date(shift.start);
  const e = new Date(shift.end);
  const hours = (e.getTime() - s.getTime()) / 3600000;
  const isHol = holidays.has(dateStr(s));
  const dayName = DN[s.getDay()];
  const endDayName = DN[e.getDay()];
  const sameDay = s.toDateString() === e.toDateString();
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
      {/* Day badge */}
      <div
        className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center shrink-0 text-xs font-semibold leading-tight ${
          shift.behivas
            ? "bg-destructive/10 text-destructive"
            : isHol
            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
            : shift.piheno
            ? "bg-primary/10 text-primary"
            : "bg-muted"
        }`}
      >
        <span className="text-base font-bold">{s.getDate()}</span>
        <span className="text-[10px]">{dayName}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">
            {pad(s.getHours())}:{pad(s.getMinutes())} →{" "}
            {!sameDay ? `${endDayName} ` : ""}
            {pad(e.getHours())}:{pad(e.getMinutes())}
          </span>
          <span className="text-xs text-muted-foreground font-medium">
            {hours.toFixed(0)}h
          </span>
        </div>
        <div className="flex gap-1 mt-1 flex-wrap">
          {shift.behivas && (
            <Badge variant="destructive" className="text-[10px] h-5">
              BEHÍVÁS
            </Badge>
          )}
          {isHol && !shift.behivas && (
            <Badge
              variant="outline"
              className="text-[10px] h-5 border-amber-300 text-amber-700 dark:text-amber-400"
            >
              ÜNNEP
            </Badge>
          )}
          {shift.piheno ? (
            <Badge
              variant="outline"
              className="text-[10px] h-5 cursor-pointer border-primary/30 text-primary"
              onClick={() =>
                startTransition(async () => {
                  await toggleShiftProp(shift.id, "isPihenonap");
                })
              }
            >
              PIHENŐ ✕
            </Badge>
          ) : (
            !shift.behivas &&
            !isHol && (
              <button
                className="text-[10px] px-2 h-5 rounded-full border border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                onClick={() =>
                  startTransition(async () => {
                    await toggleShiftProp(shift.id, "isPihenonap");
                  })
                }
              >
                + pihenőnap
              </button>
            )
          )}
        </div>
      </div>

      {/* Delete */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await deleteShift(shift.id);
            toast.success("Műszak törölve");
          })
        }
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
