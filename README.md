# OMSZ Berkalkulátor

Mentős bér- és pótlékszámító webalkalmazás az Országos Mentőszolgálat dolgozói számára.

Az alkalmazás a magyar Eszjtv 1/A (2024.03.01–) jogszabály alapján számítja a béreket, pótlékokat és adókat, figyelembe véve a műszakbeosztást, ünnepnapokat és a személyes beállításokat.

## Funkciók

- **Műszak kezelés** — Műszakok rögzítése dátum/időpont megadással, behívás és pihenőnap jelöléssel
- **Pótlék számítás** — Automatikus napszak pótlék (délutáni 20%, éjszakai 50%), ünnepnap (+150%), pihenőnap (+100%), túlóra (+150%), behívás (+200%)
- **Bérszámfejtés** — Bruttó → nettó kalkuláció TB (18,5%) és SZJA (15%) levonásokkal
- **25 alatti kedvezmény** — SZJA mentesség plafonnal (évente frissülő összeghatár)
- **Következő havi becslés** — Előrejelzés a csúsztatott pótlékok alapján
- **Többfelhasználós** — Regisztráció/bejelentkezés, minden felhasználó saját adatokkal
- **Bértábla** — OMSZ I–V. kategória (alap/kiemelt) beépítve

## Tech Stack

| Réteg | Technológia |
|-------|-------------|
| Framework | Next.js 15 (App Router) |
| UI | shadcn/ui, Tailwind CSS v4 |
| Adatbázis | PostgreSQL 16, Drizzle ORM |
| Auth | Auth.js v5 (email/jelszó) |
| Nyelv | TypeScript |
| Deploy | Docker |

## Gyors indítás

### Előfeltételek

- Node.js 22+
- Docker & Docker Compose
- npm

### 1. Klónozás és telepítés

```bash
git clone https://github.com/facsimatyi/FruzsiBerKalkulator.git
cd FruzsiBerKalkulator
npm install
```

### 2. Környezeti változók

```bash
cp .env.example .env.local
```

Szerkeszd a `.env.local` fájlt:

```env
POSTGRES_USER=omsz
POSTGRES_PASSWORD=valami_eros_jelszo
POSTGRES_DB=omsz_calculator
DATABASE_URL=postgresql://omsz:valami_eros_jelszo@localhost:5432/omsz_calculator
AUTH_SECRET=generald_openssl_rand_base64_32
AUTH_URL=http://localhost:3000
```

`AUTH_SECRET` generálása:
```bash
openssl rand -base64 32
```

### 3. Adatbázis indítása

```bash
docker compose up db -d
```

### 4. Migrációk futtatása

```bash
# SQL migrációs fájl alkalmazása
cat src/db/migrations/0000_lean_maestro.sql | sed 's/--> statement-breakpoint//g' | \
  docker exec -i $(docker compose ps -q db) psql -U omsz -d omsz_calculator
```

### 5. Fejlesztői szerver

```bash
npm run dev
```

Nyisd meg: [http://localhost:3000](http://localhost:3000)

## Produkciós deploy (Docker)

```bash
# Egy parancs — minden elindul
POSTGRES_PASSWORD=eros_jelszo AUTH_SECRET=$(openssl rand -base64 32) \
  docker compose up --build -d
```

Ez elindítja:
- **PostgreSQL 16** — `localhost:5432`
- **Next.js alkalmazás** — `localhost:3000`

### Reverse proxy mögé

Ha nginx/caddy mögé rakod, állítsd be az `AUTH_URL` env változót a publikus URL-re:

```env
AUTH_URL=https://ber.example.com
```

## Projekt struktúra

```
src/
├── app/
│   ├── (auth)/          # Login, regisztráció (nem autentikált)
│   ├── (app)/           # Dashboard, műszakok, bér, beállítások
│   └── api/auth/        # Auth.js API route
├── components/
│   ├── ui/              # shadcn/ui komponensek
│   ├── auth/            # Login/register formok
│   ├── shifts/          # Műszak lista, kártya, form
│   ├── payroll/         # Bérszámfejtés, összesítő
│   ├── settings/        # Beállítások
│   ├── layout/          # Header, navigáció
│   └── shared/          # Hónap választó, közös komponensek
├── lib/
│   ├── calculations/    # Számítási logika (pure TypeScript)
│   ├── auth.ts          # Auth.js konfiguráció
│   ├── db.ts            # Drizzle kliens
│   └── queries.ts       # Adatbázis lekérdezések
├── actions/             # Server Actions (CRUD)
└── db/
    ├── schema.ts        # Drizzle tábla definíciók
    └── migrations/      # SQL migrációk
```

## Számítási logika

A pótlékszámítás a `src/lib/calculations/` mappában található, pure TypeScript függvényekként:

- **holidays.ts** — Magyar ünnepnapok (húsvét Gauss-algoritmussal)
- **working-days.ts** — Munkanapok száma hónaponként
- **payroll.ts** — Fő orchestrátor: műszak szegmentálás → pótlék számítás → adó → nettó

### Pótlék szabályok

| Típus | Szorzó | Mikor |
|-------|--------|-------|
| Délutáni | +20% | 14:00–22:00 |
| Éjszakai | +50% | 22:00–06:00 |
| Ünnepnap | +150% | Magyar munkaszüneti napok |
| Pihenőnap | +100% | Jelölt pihenőnapos műszak |
| Túlóra | +150% | Kötelező órák feletti munka |
| Behívás | +200% | Behívásos műszak túlóra része |

## Parancsok

```bash
npm run dev          # Fejlesztői szerver
npm run build        # Produkciós build
npm run lint         # ESLint
npx drizzle-kit generate  # Új migráció generálása séma változás után
```

## Licensz

MIT
