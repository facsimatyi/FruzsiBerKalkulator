"use client";

import { useActionState } from "react";
import { loginUser } from "@/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginUser, undefined);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="nev@example.com"
          required
          autoComplete="email"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Jelszó</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
      </div>
      {state?.error && (
        <p className="text-sm text-red-500 font-medium">{state.error}</p>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Bejelentkezés..." : "Bejelentkezés"}
      </Button>
      <p className="text-sm text-center text-muted-foreground">
        Nincs fiókod?{" "}
        <Link href="/register" className="text-primary font-medium hover:underline">
          Regisztráció
        </Link>
      </p>
    </form>
  );
}
