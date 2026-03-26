"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BERTABLA, fmt } from "@/lib/calculations/constants";
import { updateSettings } from "@/actions/settings-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function OnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [birthDate, setBirthDate] = useState("");
  const [illetmenyStr, setIlletmenyStr] = useState("");
  const [hoursStr, setHoursStr] = useState("");
  const [selectedBer, setSelectedBer] = useState(-1);
  const [pending, startTransition] = useTransition();

  const parseNum = (s: string) => Number(s.replace(/\s/g, "").replace(",", ".")) || 0;
  const liveFormatMoney = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (!digits) return "";
    return Number(digits).toLocaleString("hu-HU").replace(/,/g, " ");
  };
  const illetmeny = parseNum(illetmenyStr);
  const hoursPerDay = parseNum(hoursStr);
  const orabér = hoursPerDay > 0 ? illetmeny / ((174 * hoursPerDay) / 8) : 0;

  const birthYear = birthDate ? Number(birthDate.split("-")[0]) : 0;
  const age = birthYear ? new Date().getFullYear() - birthYear : 0;

  const handleSave = () => {
    if (illetmeny <= 0 || hoursPerDay <= 0) {
      toast.error("Kérlek add meg az illetményt és az óraszámot");
      return;
    }
    startTransition(async () => {
      const fd = new FormData();
      fd.set("illetmeny", String(illetmeny));
      fd.set("hoursPerDay", String(hoursPerDay));
      fd.set("selectedBer", String(selectedBer));
      if (birthDate) fd.set("birthDate", birthDate);
      const result = await updateSettings(fd);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Beállítások mentve!");
        router.push("/dashboard");
        router.refresh();
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="text-4xl">🚑</div>
          <h1 className="text-2xl font-bold">Üdvözlünk!</h1>
          <p className="text-sm text-muted-foreground">
            Állítsd be az alapadataidat a pontos bérszámításhoz
          </p>
        </div>

        {step === 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Születési dátum</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                A 25 év alatti SZJA kedvezmény automatikus számításához
              </p>
              <Input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="text-center text-lg"
                max={new Date().toISOString().split("T")[0]}
              />
              {age > 0 && (
                <p className="text-xs text-center text-muted-foreground">
                  {age < 25 ? (
                    <span className="text-green-600 font-medium">✓ {age} éves — SZJA kedvezmény jár</span>
                  ) : (
                    <span>{age} éves — SZJA kedvezmény nem jár</span>
                  )}
                </p>
              )}
              <Button
                className="w-full"
                onClick={() => setStep(1)}
              >
                {birthDate ? "Tovább" : "Kihagyom"}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 1 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Hány órás a munkanapod?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {[4, 6, 8].map((h) => (
                  <Button
                    key={h}
                    variant={hoursStr === String(h) ? "default" : "outline"}
                    onClick={() => setHoursStr(String(h))}
                    className="text-lg font-bold"
                  >
                    {h}h
                  </Button>
                ))}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Vagy egyéni érték</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="pl. 3,85"
                  value={hoursStr}
                  onChange={(e) => setHoursStr(e.target.value)}
                  className="text-center text-lg"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(0)} className="flex-1">
                  Vissza
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => setStep(2)}
                  disabled={hoursPerDay <= 0}
                >
                  Tovább
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Mennyi a bruttó illetményed?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Bértábla sáv (opcionális)</Label>
                <select
                  value={selectedBer}
                  onChange={(e) => {
                    const i = +e.target.value;
                    setSelectedBer(i);
                    if (i >= 0) {
                      setIlletmenyStr(liveFormatMoney(String(Math.round(BERTABLA[i].min * (hoursPerDay / 8)))));
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
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Bruttó illetmény (Ft)</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="pl. 293 563"
                  value={illetmenyStr}
                  onChange={(e) => {
                    setIlletmenyStr(liveFormatMoney(e.target.value));
                    setSelectedBer(-1);
                  }}
                  className="text-center text-lg"
                />
              </div>

              {illetmeny > 0 && hoursPerDay > 0 && (
                <div className="text-center text-sm text-muted-foreground space-y-0.5">
                  <p>Órabér: <strong className="text-foreground">{fmt(orabér)} Ft</strong></p>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Vissza
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={illetmeny <= 0 || pending}
                  className="flex-1"
                >
                  {pending ? "Mentés..." : "Kezdjük!"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step indicator */}
        <div className="flex justify-center gap-2">
          {[0, 1, 2].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                s === step ? "w-8 bg-primary" : "w-1.5 bg-muted"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
