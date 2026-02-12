# Duális Képzés Backend - Átadási Dokumentáció

> **Utolsó frissítés**: 2026-02-12 (Típusbiztonsági refaktor, Clean Code fejlesztések, Role-Based Security)  
> **Projekt státusz**: Production-ready

---

## 1. Projekt Áttekintés

### Cél
A Duális Képzés rendszer backend szolgáltatása. Az alkalmazás célja a hallgatók, cégek, egyetemi szereplők és a duális képzés adminisztrációjának támogatása egy robusztus, biztonságos és skálázható REST API-n keresztül.

### Technológiai Stack

| Komponens | Technológia | Verzió |
|:----------|:------------|:-------|
| Runtime | Node.js | v18+ |
| Nyelv | TypeScript | ^5.9 |
| Keretrendszer | Express | ^5.2 |
| Adatbázis | PostgreSQL | - |
| ORM | Prisma | ^5.10 |
| Validáció | Zod | ^4.1 |
| Autentikáció | JWT + Bcrypt | - |
| Háttérfolyamatok | BullMQ (Redis) | ^5.66 |
| Email | Nodemailer (SMTP) | ^7.0 |
| Dokumentáció | Swagger/OpenAPI | - |
| Tesztelés | Jest + Supertest | ^30.2 |

---

## 2. Környezeti Változók

A `.env` fájl szükséges változói:

### Alapvető konfiguráció
```env
# Szerver
PORT=3000
NODE_ENV="development"  # vagy "production"
```

### Adatbázis
```env
# PostgreSQL kapcsolat (Prisma)
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
DIRECT_URL="postgresql://user:password@host:5432/database?schema=public"
```

> **Fontos**: A Prisma a `DIRECT_URL` változót használja a schema.prisma-ban!

### Biztonság
```env
# JWT titkos kulcs (min. 32 karakter ajánlott)
JWT_SECRET="szuper_titkos_kulcs_min_32_karakter"

# Frontend URL (jelszó visszaállító linkekhez)
FRONTEND_URL="http://localhost:3000"
```

### Email (SMTP)
```env
# Mailtrap (development) vagy valós SMTP (production)
MAILTRAP_USER="your_mailtrap_user"
MAILTRAP_PASS="your_mailtrap_pass"

# Vagy általános SMTP beállítások
SMTP_USER="smtp_user"
SMTP_PASS="smtp_pass"
SMTP_HOST="sandbox.smtp.mailtrap.io"
SMTP_PORT=2525

# Globális email kapcsoló (true/false)
EMAILS_ENABLED=false
```

### Redis (BullMQ - Háttérfolyamatok)
```env
# Opció 1: URL formátum
REDIS_URL="redis://user:password@host:port"

# Opció 2: Komponensek
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD="optional_password"
REDIS_USERNAME="optional_username"
```

> **Megjegyzés**: Ha nincs Redis konfigurálva, az email küldés szinkron módon vagy mock-olva működik.

---

## 3. Adatbázis

### Adatbázis Elérhetőség
Az adatbázis kapcsolati stringet a `DIRECT_URL` környezeti változóban kell megadni.

> **Fejlesztéshez**: Használj lokális PostgreSQL-t vagy Docker konténert.

### Fontos Parancsok

```bash
# Séma szinkronizálása (fejlesztéshez)
npm run prisma:push

# Prisma Studio (vizuális adatbázis kezelő)
npm run prisma:studio

# Seed adatok betöltése
npx prisma db seed

# Séma formázása
npm run prisma:format
```

### Adatbázis Séma Fájl
`prisma/schema.prisma`

### Fő Entitások
- **User** - Felhasználói fiókok (minden szerepkörhöz)
- **StudentProfile** - Hallgatói profil adatok
- **CompanyEmployee** - Céges munkavállalók/mentorok
- **Company** - Cég adatok
- **Position** - Állásajánlatok/pozíciók
- **Application** - Jelentkezések
- **DualPartnership** - Duális partneri kapcsolatok
- **Notification** - Értesítések
- **News** - Hírek/közlemények
- **AuditLog** - Audit napló

### Felhasználói Szerepkörök (Role enum)
| Szerepkör | Leírás |
|:----------|:-------|
| `STUDENT` | Hallgató |
| `COMPANY_ADMIN` | Cégadminisztrátor |
| `MENTOR` | Céges mentor |
| `UNIVERSITY_USER` | Egyetemi kapcsolattartó |
| `SYSTEM_ADMIN` | Rendszergazda |

---

## 4. Deployment

### Fejlesztési Környezet (Railway - Jelenleg)
A fejlesztés során Railway platformot használunk tesztelésre:
- **API Base URL**: `https://dual-kepzes-backend-production-7c45.up.railway.app`
- **Swagger UI**: `https://dual-kepzes-backend-production-7c45.up.railway.app/api-docs`

> **Megjegyzés**: Ez csak fejlesztési/teszt környezet! Az éles rendszer más platformon lesz hostolva.

### Railway CLI Parancsok (Fejlesztéshez)
```bash
# Bejelentkezés
railway login

# Projekt kiválasztása
railway link

# Logok megtekintése
railway logs
```

### Production Deployment Követelmények
Az éles környezethez az alábbi komponensek szükségesek:

| Komponens | Leírás |
|:----------|:-------|
| **Node.js Server** | v18+ futtatókörnyezet |
| **PostgreSQL** | Adatbázis szerver |
| **Redis** | Opcionális - háttérfolyamatokhoz (BullMQ) |
| **SMTP Szerver** | Email küldéshez |

### Build és Indítás (Production)
```bash
# 1. Függőségek telepítése
npm install

# 2. TypeScript fordítás
npm run build

# 3. Adatbázis migrálás
npm run prisma:push

# 4. Szerver indítása
npm start
```

### Szükséges Környezeti Változók (Production)
```env
NODE_ENV=production
PORT=3000
JWT_SECRET=<erős titkos kulcs>
DIRECT_URL=<PostgreSQL connection string>
FRONTEND_URL=<frontend alkalmazás URL>
SMTP_USER=<SMTP felhasználó>
SMTP_PASS=<SMTP jelszó>
SMTP_HOST=<SMTP szerver>
SMTP_PORT=<SMTP port>
# Opcionális:
REDIS_URL=<Redis connection string>
```

---

## 5. Fejlesztői Környezet

### Előfeltételek
- **Node.js**: v18.x vagy újabb
- **npm**: Csomagkezelő (Node.js része)
- **PostgreSQL**: Helyi adatbázis vagy Docker
- **Redis**: Opcionális, háttérfolyamatokhoz

### Telepítés

```bash
# 1. Repository klónozása
git clone https://github.com/DrozsdikAdam/dual-kepzes-backend.git
cd dual-kepzes-backend

# 2. Függőségek telepítése
npm install

# 3. .env fájl létrehozása (lásd 2. szekció)

# 4. Adatbázis szinkronizálása
npm run prisma:push

# 5. Szerver indítása (development)
npm run dev
```

### NPM Scriptek

| Parancs | Leírás |
|:--------|:-------|
| `npm run dev` | Fejlesztői szerver (nodemon + tsx) |
| `npm start` | Production szerver (dist/) |
| `npm run build` | TypeScript fordítás |
| `npm run prisma:push` | DB séma szinkronizálás |
| `npm run prisma:studio` | Prisma Studio GUI |
| `npm run test` | Jest tesztek futtatása |
| `npm run lint` | ESLint ellenőrzés |
| `npm run format` | Prettier formázás |

---

## 6. Projekt Struktúra

```
dual-kepzes-backend/
├── prisma/
│   ├── schema.prisma      # Adatbázis modellek
│   ├── seed.ts            # Seed szkript
│   └── migrations/        # DB migrációk
├── scripts/
│   ├── api-tests/         # API teszt szkriptek
│   ├── email/             # Email tesztelés
│   ├── notifications/     # Notification tesztek
│   ├── password/          # Jelszó kezelő eszközök
│   └── seed/              # Extra seed szkriptek
├── src/
│   ├── app.ts             # Express app inicializálás
│   ├── server.ts          # Szerver belépési pont
│   ├── constants.ts       # Konstansok
│   ├── config/            # Konfigurációk (DB, Redis, Email, CORS, Swagger)
│   ├── controllers/       # Request/Response kezelők
│   ├── middlewares/       # Auth, Validation, RateLimit, Error
│   ├── routes/            # API végpont definíciók
│   ├── schemas/           # Zod validációs sémák
│   ├── services/          # Üzleti logika
│   ├── types/             # TypeScript típusok
│   ├── utils/             # Segédfüggvények
│   └── errors/            # Egyedi hibaosztályok
├── uploads/               # Feltöltött fájlok
├── .env                   # Környezeti változók (NE COMMITOLD!)
├── package.json
├── tsconfig.json
└── README.md
```

---

## 7. Alapértelmezett Felhasználók (Seed)

A seed szkript (`npx prisma db seed`) a következő felhasználókat hozza létre:

| Email | Szerepkör | Jelszó |
|:------|:----------|:-------|
| `admin@system.com` | SYSTEM_ADMIN | `TesztJelszo123!` |
| `uni@university.com` | UNIVERSITY_USER | `TesztJelszo123!` |
| `diak@student.com` | STUDENT | `TesztJelszo123!` |

> **FIGYELEM**: Production környezetben ezeket a jelszavakat AZONNAL változtasd meg!

---

## 8. Aktuális Fejlesztési Állapot

### ✅ Befejezett Funkciók
- Értesítési rendszer (NotificationController)
- Duális Képzési Megállapodások (DualPartnershipController)
- Hírek és Közlemények (NewsController)
- Jelszó visszaállítás (Password Reset)
- Profil szerkesztés (Hallgatói és Céges)
- Szűrés duális/nem duális pozíciókra
- Alapvető statisztikák
- **GDPR-kompatibilis fájlfeltöltés** (CV kötelező, motivációs levél opcionális)
  - Fájlok csak memóriában, nem kerülnek tárolásra
  - Automatikus továbbítás céges adminoknak emailben
- **Globális konvenció váltás**: A fájlrendszer átállítva camelCase with dots (`nameType.type.ts`) struktúrára a jobb olvashatóság érdekében.
- **Bővített hírcsatornák**: A hírek mostantól minden felhasználói szerepkörre (Student, Mentor, UniUser, stb.) külön is megcélozhatóak.
- **Kikapcsolt email megerősítés**
  - A regisztráció után a felhasználók azonnal be tudnak jelentkezni megerősítés nélkül.
  - Az automatikus megerősítő email küldése kikapcsolva.
- **Feltételes hallgatói validáció**
  - Ha `isInHighSchool = true`: `firstChoiceId` és `secondChoiceId` kötelező, `neptunCode` opcionális
  - Ha `hasLanguageCert = true`: `language` és `languageLevel` kötelező
- **Szak (Major) kezelés** - CRUD műveletek `/api/majors` végponton:
  - Szakok listázása, létrehozása, frissítése, törlése
  - StudentProfile kapcsolat: `majorId`, `firstChoiceId`, `secondChoiceId` → Major táblára hivatkozik
- **Bővített statisztikák**: Teljes körű API statisztikák elérhetőek a `/api/stats` alatt (Jelentkezések, Partnerségek, Pozíciók, Trendek).
- **Konvenció szerinti félév kezelés**: A duális partnerségeknél a félévek egységes "YYYY/YY/S" formátumban kerülnek rögzítésre.
- **Rendszergazdai email policy**: A `SYSTEM_ADMIN` felhasználók csak jelszó-visszaállítást és verifikációs emaileket kapnak, más értesítéseknél kimaradnak a levéllistából (adatbiztonsági és kényelmi okokból).
- **Profil váltás (Középiskola -> Egyetem)**: Dedikált végpont a hallgatók számára az egyetemi adatok (Neptun, Szak) rögzítésére és a státuszváltásra (Rendszergazdai értesítéssel).
- **Adminisztrátori kontroll**: A rendszergazdák automatikus értesítést kapnak minden cégadat-módosításról, aktiválásról vagy deaktiválásról.
- **Külön regisztrációs végpontok**:
  - `POST /api/auth/register/company-admin`: Dedikált végpont cégadminoknak.
  - `POST /api/auth/register/system-admin`: Dedikált végpont rendszeradminoknak.
  - A generikus `/api/auth/register` végponton a `COMPANY_ADMIN` és `SYSTEM_ADMIN` szerepkörök tiltva vannak.
- **Biztonsági Erősítések**:
  - **Ownership Middleware**: Szigorú adathozzáférés-ellenőrzés minden módosító és törlő végponton.
  - **Idempotency Kulcsok**: Dupla submit védelem a kritikus POST műveleteknél.
  - **Magic Bytes Validáció**: Fájltípus ellenőrzés a tartalom alapján (PDF, Word).
  - **Audit és Biztonsági Naplózás**: 401/403 hibák és gyanús események automatikus rögzítése.
  - **Státusz Átmenet Validálás**: Csak az üzletileg érvényes állapotváltások engedélyezettek.
  - **Role Korlátozás**: System Admin és Company Admin szerepkörök csak dedikált végpontokon keresztül regisztrálhatnak.
- **Munkakeresésre jelentkezett hallgatók**: Dedikált végpont (`GET /api/students/available`) a munkát kereső hallgatók listázására, publikus (nem érzékeny) adatokkal.
- **Pozíció-Szak kapcsolat**: A `Position` modellhez opcionális `majorId` FK hozzáadva a `Major` táblára. A pozíciók válaszában megjelenik a kapcsolt szak (`major`) objektum.
- **Partnership aktiválás logika**: A partnerség csak akkor válhat `ACTIVE`-vá, ha van hozzárendelt mentor és egyetemi felügyelő. Aktiváláskor a hallgató `isAvailableForWork` állapota automatikusan `false`-ra áll (tranzakcióban).
- **Role-Based Endpoint Security (RBAC)**: Minden API végpont szerepkör-alapú hozzáférés-vezérléssel van ellátva a `requireRole` middleware segítségével. A role helper-ek (`isStudent`, `isCompanyAdmin`, `isCompanyEmployee`, `isMentor`, `isUniversityUser`, `isUniversityStaff`, `isSystemAdmin`, `isStaff`) biztosítják, hogy csak a megfelelő jogosultsággal rendelkező felhasználók férhessenek hozzá az adott végpontokhoz. Mind a 14 route fájl frissítve.
- **Munkakeresési elérhetőség toggle**: Dedikált végpont (`PATCH /api/students/me/toggle-availability`) a hallgatók számára az `isAvailableForWork` mező ki-/bekapcsolására. A művelet naplózásra kerül az audit logba.
- **Típusbiztonsági Refaktor**:
  - Teljes körű TypeScript típusbiztosság a `Service` és `Controller` rétegekben.
  - `any` típusok kivezetése a kritikus logikákból (`StudentService`, `AuthService`, `JobService`, `NewsService`, `CompanyService`).
  - Zod sémákból származtatott input típusok használata a kontroller request body-kban.
- **Clean Code & DRY fejlesztések**:
  - **Helyszínkezelés**: Központosított `prepareLocationData` helper az összes szolgáltatás számára.
  - **Értesítések**: Központosított `notifySystemAdmins` segédfüggvény és service-szintű értesítéskezelés (SRP elv követése).
  - **Email validáció**: `ensureEmailNotTaken` helper az `AuthService`-ben.

### 🔄 Fejlesztés Alatt
- Részletes keresés és szűrés (város, kategória, kulcsszó)
- Tesztkörnyezet (Jest - alap konfig kész)
- Bővített riportok

### ❌ Hiányzó/Tervezett Funkciók
- Logout (Token feketelista)
- Integrációs tesztek
- Riportok exportálása (CSV/PDF)

> Részletes lista: `CHECKLIST.md`

---

## 9. Dokumentáció Hivatkozások

| Dokumentum | Leírás |
|:-----------|:-------|
| [README.md](./README.md) | Fő dokumentáció, API végpontok |
| [API_PAGINATION.md](./API_PAGINATION.md) | Lapozás és válasz formátum |
| [CHECKLIST.md](./CHECKLIST.md) | Fejlesztési teendők |
| Swagger UI | Interaktív API dokumentáció (helyi: `http://localhost:3000/api-docs`) |
| [scripts/README.md](./scripts/README.md) | Segéd szkriptek leírása |

---

## 10. Támogatás és Kapcsolat

### Repository
- **GitHub**: `https://github.com/DrozsdikAdam/dual-kepzes-backend`

### Hasznos Tippek
1. Mindig a `npm run dev` paranccsal fejlessz
2. Adatbázis változtatásoknál futtasd: `npm run prisma:push`
3. Az API dokumentációt a Swagger UI-on teszteld
4. Helyi fejlesztéskor: `npm run dev` (hot-reload)

---

> **Megjegyzés**: Ez a dokumentáció a projekt 2026-02-11-i állapotát tükrözi. Kérd az aktualizálását, ha jelentős változások történnek.
