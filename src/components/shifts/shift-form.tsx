"use client";

import { useState, useTransition } from "react";
import { createShift } from "@/actions/shift-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

interface Props {
  year: number;
  month: number;
  onSuccess: () => void;
}

export function ShiftForm({ year, month, onSuccess }: Props) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const now = new Date();
  const dim = new Date(year, month + 1, 0).getDate();
  const day = Math.min(now.getDate(), dim);

  const [startTime, setStartTime] = useState(
    `${year}-${pad(month + 1)}-${pad(day)}T08:00`
  );
  const [endTime, setEndTime] = useState("");
  const [isBehivas, setIsBehivas] = useState(false);
  const [isPihenonap, setIsPihenonap] = useState(false);
  const [pending, startTransition] = useTransition();

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

  const handleSubmit = () => {
    if (!isValid) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("startTime", startTime);
      fd.set("endTime", endTime);
      fd.set("isBehivas", String(isBehivas));
      fd.set("isPihenonap", String(isPihenonap));
      const result = await createShift(fd);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Műszak hozzáadva");
        // Reset for next shift (1 week later)
        const nd = new Date(startTime);
        nd.setDate(nd.getDate() + 7);
        setStartTime(
          `${nd.getFullYear()}-${pad(nd.getMonth() + 1)}-${pad(nd.getDate())}T08:00`
        );
        setEndTime("");
        setIsBehivas(false);
        setIsPihenonap(false);
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
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => {
                setStartTime(e.target.value);
                setEndTime("");
              }}
              className="block w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm h-8 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-datetime-edit]:w-full [&::-webkit-calendar-picker-indicator]:opacity-50"
              style={{ maxWidth: "100%", boxSizing: "border-box" }}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Vége</Label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="block w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm h-8 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-datetime-edit]:w-full [&::-webkit-calendar-picker-indicator]:opacity-50"
              style={{ maxWidth: "100%", boxSizing: "border-box" }}
            />
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
          </p>
        )}

        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <Switch
              checked={isBehivas}
              onCheckedChange={(v) => {
                setIsBehivas(v);
                if (v) setIsPihenonap(false);
              }}
            />
            <Label className="text-xs">Behívás</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={isPihenonap}
              onCheckedChange={(v) => {
                setIsPihenonap(v);
                if (v) setIsBehivas(false);
              }}
            />
            <Label className="text-xs">Pihenőnap</Label>
          </div>
        </div>

        <Button
          className="w-full"
          disabled={!isValid || pending}
          onClick={handleSubmit}
        >
          {pending ? "Mentés..." : "Hozzáadás"}
        </Button>
      </CardContent>
    </Card>
  );
}
