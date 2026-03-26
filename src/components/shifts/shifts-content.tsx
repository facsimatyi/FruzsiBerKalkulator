"use client";

import { useState, useTransition } from "react";
import { MonthSelector } from "@/components/shared/month-selector";
import { ShiftCard } from "@/components/shifts/shift-card";
import { ShiftForm } from "@/components/shifts/shift-form";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { deleteAllMonthShifts } from "@/actions/shift-actions";
import { toast } from "sonner";
import type { ShiftData } from "@/lib/calculations/constants";

interface Props {
  year: number;
  month: number;
  shifts: ShiftData[];
  holidays: string[];
}

export function ShiftsContent({ year, month, shifts, holidays }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [pending, startTransition] = useTransition();
  const holidaySet = new Set(holidays);

  const totalH = shifts.reduce((sum, s) => {
    return sum + (new Date(s.end).getTime() - new Date(s.start).getTime()) / 3600000;
  }, 0);

  return (
    <div className="space-y-4">
      <MonthSelector />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Műszakok</h2>
          <p className="text-xs text-muted-foreground">
            {shifts.length} db • {totalH.toFixed(0)}h
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowForm(!showForm)}
          variant={showForm ? "outline" : "default"}
        >
          {showForm ? (
            "Mégsem"
          ) : (
            <>
              <Plus className="h-4 w-4 mr-1" /> Hozzáadás
            </>
          )}
        </Button>
      </div>

      {showForm && (
        <ShiftForm
          year={year}
          month={month}
          onSuccess={() => setShowForm(false)}
        />
      )}

      {shifts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">Nincs rögzített műszak</p>
          <p className="text-xs mt-1">
            Adj hozzá műszakokat a pótlék számításhoz
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {shifts.map((shift) => (
            <ShiftCard key={shift.id} shift={shift} holidays={holidaySet} />
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            disabled={pending}
            onClick={() => {
              if (confirm("Törlöd az összes műszakot ebben a hónapban?")) {
                startTransition(async () => {
                  await deleteAllMonthShifts(year, month);
                  toast.success("Összes műszak törölve");
                });
              }
            }}
          >
            <Trash2 className="h-3 w-3 mr-1" /> Összes törlése
          </Button>
        </div>
      )}
    </div>
  );
}
