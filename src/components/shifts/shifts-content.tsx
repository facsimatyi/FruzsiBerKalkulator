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
  const [editingShift, setEditingShift] = useState<ShiftData | null>(null);
  const [pending, startTransition] = useTransition();
  const holidaySet = new Set(holidays);

  // Clip shift hours to the selected month (UTC boundaries to match stored shift data)
  const monthStart = Date.UTC(year, month, 1);
  const monthEnd = Date.UTC(year, month + 1, 1);

  const clippedHours = (s: ShiftData) => {
    const start = Math.max(new Date(s.start).getTime(), monthStart);
    const end = Math.min(new Date(s.end).getTime(), monthEnd);
    return Math.max(0, (end - start) / 3600000);
  };

  const totalH = shifts.reduce((sum, s) => sum + clippedHours(s), 0);

  const handleEdit = (shift: ShiftData) => {
    setEditingShift(shift);
    setShowForm(false);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingShift(null);
  };

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
          onClick={() => {
            if (showForm || editingShift) {
              handleFormClose();
            } else {
              setShowForm(true);
            }
          }}
          variant={showForm || editingShift ? "outline" : "default"}
        >
          {showForm || editingShift ? (
            "Mégsem"
          ) : (
            <>
              <Plus className="h-4 w-4 mr-1" /> Hozzáadás
            </>
          )}
        </Button>
      </div>

      {/* Add form */}
      {showForm && (
        <ShiftForm
          year={year}
          month={month}
          holidays={holidays}
          onSuccess={handleFormClose}
        />
      )}

      {/* Edit form */}
      {editingShift && (
        <ShiftForm
          year={year}
          month={month}
          holidays={holidays}
          onSuccess={handleFormClose}
          editShift={editingShift}
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
            <ShiftCard
              key={shift.id}
              shift={shift}
              holidays={holidaySet}
              clippedH={clippedHours(shift)}
              onEdit={handleEdit}
            />
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
