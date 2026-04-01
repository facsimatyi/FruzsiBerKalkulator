"use client";

import { useTransition } from "react";
import { deleteShift } from "@/actions/shift-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { toast } from "sonner";
import { DN } from "@/lib/calculations/constants";
import type { ShiftData } from "@/lib/calculations/constants";

/** UTC version of dateStr for client-side use (shift data is stored as UTC) */
function dateStrUTC(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

interface Props {
  shift: ShiftData;
  holidays: Set<string>;
  clippedH?: number;
}

export function ShiftCard({ shift, holidays, clippedH }: Props) {
  const [pending, startTransition] = useTransition();
  const s = new Date(shift.start);
  const e = new Date(shift.end);
  const fullHours = (e.getTime() - s.getTime()) / 3600000;
  const hours = clippedH ?? fullHours;
  const isClipped = clippedH !== undefined && Math.abs(clippedH - fullHours) > 0.01;
  const isHol = holidays.has(dateStrUTC(s));
  const dayName = DN[s.getUTCDay()];
  const endDayName = DN[e.getUTCDay()];
  const sameDay =
    s.getUTCFullYear() === e.getUTCFullYear() &&
    s.getUTCMonth() === e.getUTCMonth() &&
    s.getUTCDate() === e.getUTCDate();
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
            : "bg-muted"
        }`}
      >
        <span className="text-base font-bold">{s.getUTCDate()}</span>
        <span className="text-[10px]">{dayName}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">
            {pad(s.getUTCHours())}:{pad(s.getUTCMinutes())} →{" "}
            {!sameDay ? `${endDayName} ` : ""}
            {pad(e.getUTCHours())}:{pad(e.getUTCMinutes())}
          </span>
          <span className="text-xs text-muted-foreground font-medium">
            {hours.toFixed(0)}h{isClipped ? ` (${fullHours.toFixed(0)}h-ból)` : ""}
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
