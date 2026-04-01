"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Calendar } from "lucide-react";
import { toast } from "sonner";
import {
  seedDefaultHolidays,
  upsertHoliday,
  toggleHoliday,
  deleteHoliday,
} from "@/actions/holiday-actions";
import type { UserHoliday } from "@/db/schema";

interface Props {
  holidays: UserHoliday[];
}

export function HolidaysSection({ holidays }: Props) {
  const [pending, startTransition] = useTransition();
  const [showAdd, setShowAdd] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newName, setNewName] = useState("");
  const [newStartHour, setNewStartHour] = useState("");
  const [newEndHour, setNewEndHour] = useState("");

  // Group holidays by year
  const byYear: Record<string, UserHoliday[]> = {};
  for (const h of holidays) {
    const y = h.date.slice(0, 4);
    if (!byYear[y]) byYear[y] = [];
    byYear[y].push(h);
  }
  const years = Object.keys(byYear).sort();

  const handleSeed = (year: number) => {
    startTransition(async () => {
      const result = await seedDefaultHolidays(year);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(`${year}. évi ünnepnapok betöltve`);
      }
    });
  };

  const handleAdd = () => {
    if (!newDate || !newName) {
      toast.error("Dátum és név kötelező");
      return;
    }
    const fd = new FormData();
    fd.set("date", newDate);
    fd.set("name", newName);
    if (newStartHour) fd.set("startHour", newStartHour);
    if (newEndHour) fd.set("endHour", newEndHour);

    startTransition(async () => {
      const result = await upsertHoliday(fd);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Ünnepnap mentve");
        setNewDate("");
        setNewName("");
        setNewStartHour("");
        setNewEndHour("");
        setShowAdd(false);
      }
    });
  };

  const formatHours = (h: UserHoliday) => {
    if (h.startHour === null && h.endHour === null) return "Egész nap";
    const start = h.startHour ?? 0;
    const end = h.endHour ?? 24;
    return `${String(start).padStart(2, "0")}:00 – ${String(end).padStart(2, "0")}:00`;
  };

  const formatDate = (d: string) => {
    const [y, m, day] = d.split("-");
    const DN = ["V", "H", "K", "Sze", "Cs", "P", "Szo"];
    const date = new Date(Number(y), Number(m) - 1, Number(day));
    return `${m}.${day}. (${DN[date.getDay()]})`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Ünnepnapok</h2>
        <Button
          size="sm"
          onClick={() => setShowAdd(!showAdd)}
          variant={showAdd ? "outline" : "default"}
        >
          {showAdd ? "Mégsem" : <><Plus className="h-4 w-4 mr-1" /> Új ünnepnap</>}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Az itt beállított ünnepnapok számítanak az automatikus pótlék számításnál.
        Részleges napot is megadhatsz (pl. csak 12:00-tól).
      </p>

      {/* Seed buttons */}
      <div className="flex gap-2 flex-wrap">
        {[2024, 2025, 2026, 2027].map((y) => (
          <Button
            key={y}
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => handleSeed(y)}
          >
            <Calendar className="h-3.5 w-3.5 mr-1" />
            {y} betöltése
          </Button>
        ))}
      </div>

      {/* Add form */}
      {showAdd && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Dátum</Label>
                <Input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Megnevezés</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="pl. Karácsony"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Kezdés (opcionális)</Label>
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={newStartHour}
                  onChange={(e) => setNewStartHour(e.target.value)}
                  placeholder="0 (egész nap)"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Vég (opcionális)</Label>
                <Input
                  type="number"
                  min={1}
                  max={24}
                  value={newEndHour}
                  onChange={(e) => setNewEndHour(e.target.value)}
                  placeholder="24 (egész nap)"
                  className="mt-1"
                />
              </div>
            </div>
            <Button onClick={handleAdd} disabled={pending} className="w-full">
              Mentés
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Holiday list by year */}
      {holidays.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">Nincsenek ünnepnapok beállítva</p>
          <p className="text-xs mt-1">Töltsd be az alapértelmezett ünnepnapokat a gombokkal</p>
        </div>
      ) : (
        years.map((y) => (
          <Card key={y}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{y}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {byYear[y].map((h) => (
                <div
                  key={h.id}
                  className="flex items-center gap-3 py-2"
                >
                  <Switch
                    checked={h.isActive}
                    onCheckedChange={(checked) =>
                      startTransition(async () => {
                        await toggleHoliday(h.id, checked);
                      })
                    }
                    disabled={pending}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${!h.isActive ? "line-through text-muted-foreground" : ""}`}>
                        {h.name}
                      </span>
                    </div>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span>{formatDate(h.date)}</span>
                      <span>•</span>
                      <span>{formatHours(h)}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await deleteHoliday(h.id);
                        toast.success("Ünnepnap törölve");
                      })
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
