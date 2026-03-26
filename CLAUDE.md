# OMSZ Bérkalkulátor

Mentős bér- és pótlékszámító Next.js 15 alkalmazás, PostgreSQL + Drizzle ORM + Auth.js v5.

## Commands

```bash
npm run dev                    # Dev szerver (port 3000)
npm run build                  # Produkciós build (standalone output)
npm run lint                   # ESLint
docker compose up db -d        # PostgreSQL indítása lokálisan
npx drizzle-kit generate       # Migráció generálás séma változás után
npx drizzle-kit push           # Séma push dev-ben (DATABASE_URL kell env-ben)
```

## Tech Stack

- **Next.js 15** App Router, Server Components, Server Actions
- **TypeScript** strict mode
- **Tailwind CSS v4** + **shadcn/ui** (New York style, komponensek: `src/components/ui/`)
- **Drizzle ORM** + PostgreSQL 16 (séma: `src/db/schema.ts`)
- **Auth.js v5** CredentialsProvider, JWT session
- **Zod v4** validáció (`.issues` nem `.errors` a hibákhoz)

## Architecture

- `src/app/(auth)/` — Nem autentikált oldalak (login, register)
- `src/app/(app)/` — Autentikált oldalak (dashboard, shifts, payroll, settings)
- `src/lib/calculations/` — PURE TypeScript számítási logika, NINCS React függőség
- `src/actions/` — Server Actions, minden action ellenőrzi session ownership-et
- `src/lib/queries.ts` — DB lekérdezések, ShiftData formátumra mappol
- Hónap választás URL search params-ban: `?year=2026&month=3` (month 0-indexed)

## Critical Rules

- A számítási logika (`src/lib/calculations/`) SOHA ne importáljon React-et
- Server Action-ökben MINDIG ellenőrizd a session-t és a user ownership-et
- `useActionState` React 19-ben: action szignóz `(prevState, formData)` — nem csak `formData`
- Drizzle timestamp-ek `Date` objektumként jönnek, ISO string-re kell konvertálni a ShiftData-hoz
- Pótlék szabályok: DU 20%, Éj 50%, Ünnep 150%, Pihenő 100%, Túlóra 150%, Behívás 200%
- TB mindig 18.5%, SZJA 15% (25 alatti kedvezmény plafonnal: `SZJA_CAP` a `constants.ts`-ben)
- Pótlékok csúsztatva: az adott havi fizetésen az ELŐZŐ havi pótlékok jelennek meg

## Database

4 tábla: `users`, `user_settings` (1:1), `shifts`, `kedvezmeny_map`
- Minden FK cascade on delete
- `shifts` index: `(user_id, start_time)` — havi lekérdezéshez
- `kedvezmeny_map` sparse: ha nincs sor, `defaultKedv()` dönt

## Style Guide

- Magyar nyelv a UI-ban, angol a kódban (változók, függvények)
- shadcn/ui komponensek használata — NE írj egyedi UI primitívet
- Mobile-first: alsó tab nav mobilon, sidebar desktopon (`md:` breakpoint)
- `fmt()` használata számok formázásához (`hu-HU` locale)
- Toast értesítések: `sonner` a `toast()` hívásokkal

## Gotchas

- `next.config.ts`: `output: "standalone"` a Docker build-hez szükséges
- `serverExternalPackages: ["pg"]` kell a PostgreSQL driver-hez
- `.env.local` NEM commitolódik (gitignore), `.env.example` igen
- Docker compose-hoz `POSTGRES_PASSWORD` és `AUTH_SECRET` env var kötelező
- Drizzle-kit CLI-nek explicit `DATABASE_URL` env var kell (nem olvassa a .env.local-t)
