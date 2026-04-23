# Duális Képzés Backend - Átadási Dokumentáció

> **Utolsó frissítés**: 2026-04-15 (Pozíció típusrendszer, Referens Dashboard, Automatikus hozzárendelés, Referens Switcher)
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
| Adatbázis | PostgreSQL | — |
| ORM | Prisma | ^5.10 |
| Validáció | Zod | ^4.1 |
| Autentikáció | JWT + Bcrypt | — |
| Háttérfolyamatok | BullMQ (Redis) | ^5.66 |
| Email | Nodemailer | ^7.0 |
| Képoptimalizálás | Sharp | ^0.34 |
| S3 tárolás | @aws-sdk/client-s3 | ^3.1020 |
| Tesztelés | Jest + Supertest | — |
| Dokumentáció | Swagger/OpenAPI | — |

### Repository
- **GitHub**: `https://github.com/DrozsdikAdam/dual-kepzes-backend`
- **Production URL**: `https://dual-kepzes-backend-production-7c45.up.railway.app`
- **Swagger UI**: `/api-docs`

---

## 2. Telepítés és Indítás

```bash
# 1. Klónozás
git clone https://github.com/DrozsdikAdam/dual-kepzes-backend.git
cd dual-kepzes-backend

# 2. Függőségek
npm install

# 3. .env fájl létrehozása (lásd a 3. fejezet)

# 4. Adatbázis szinkronizáció
npm run prisma:push

# 5. Indítás
npm run dev
```

### Elérhető Szkriptek

| Parancs | Leírás |
|:--------|:-------|
| `npm run dev` | Fejlesztői szerver (nodemon + tsx) |
| `npm start` | Production indítás (`dist/`) |
| `npm run build` | TypeScript → JavaScript fordítás |
| `npm run prisma:push` | DB séma szinkronizáció |
| `npm run prisma:studio` | Adatbázis GUI |
| `npm run test` | Jest tesztek futtatása |
| `npm run lint` | ESLint kódminőség-ellenőrzés |
| `npm run format` | Prettier formázás |
| `npx tsx scripts/verify_features.ts` | Üzleti logika verifikáció |
| `npx tsx scripts/cleanup_test_data.ts` | Tesztadatok takarítása |

---

## 3. Környezeti Változók

A `.env` fájl szükséges változói:

```env
# Szerver
PORT=3000
NODE_ENV="development"

# Adatbázis
DATABASE_URL="postgresql://user:password@localhost:5432/dual_db?schema=public"
DIRECT_URL="postgresql://user:password@localhost:5432/dual_db?schema=public"

# Biztonság
JWT_SECRET="szuper_titkos_kulcs_min_32_karakter"

# Frontend URL (jelszó visszaállító linkhez)
FRONTEND_URL="http://localhost:3000"

# Email (Mailtrap)
MAILTRAP_USER="your_user"
MAILTRAP_PASS="your_pass"

# Redis (Opcionális, BullMQ-hoz)
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_ENABLED="false"

# Supabase S3 (Képkezelés)
SUPABASE_S3_REGION="eu-central-1"
SUPABASE_S3_ENDPOINT="https://..."
SUPABASE_S3_ACCESS_KEY_ID="your_access_key"
SUPABASE_S3_SECRET_ACCESS_KEY="your_secret_key"
SUPABASE_S3_BUCKET_NAME="ImageBucket"
SUPABASE_PUBLIC_URL="https://..."
```

---

## 4. Projekt Struktúra

```
dual-kepzes-backend/
├── prisma/
│   ├── schema.prisma          # Adatbázis modellek és enum-ok
│   └── seed.ts                # Kezdeti adatfeltöltő szkript
├── scripts/
│   ├── verify_features.ts     # Teljes üzleti logika verifikáció
│   ├── cleanup_test_data.ts   # Tesztadatok biztonságos takarítása
│   ├── seed-students.ts       # Hallgatói tesztadatok
│   ├── seed-uni-users.ts      # Egyetemi felhasználó tesztadatok
│   └── test-image-*.ts        # Képfeltöltés tesztelő szkriptek
├── src/
│   ├── config/                # Konfiguráció (DB, Redis, Email, CORS, Swagger)
│   ├── controllers/           # Request/Response kezelés (19 controller)
│   ├── errors/                # Egyedi hibaosztályok (AppError, NotFoundError, stb.)
│   ├── middlewares/           # Auth, Validáció, RateLimit, Ownership, Idempotency
│   ├── routes/                # API végpont definíciók (19 route fájl)
│   ├── schemas/               # Zod validációs sémák (13 séma)
│   ├── services/              # Üzleti logika réteg (20 service)
│   ├── types/                 # TypeScript típusdefiníciók és mapper-ek
│   ├── utils/                 # Segédfüggvények (Logger, Token, Pagination)
│   ├── app.ts                 # Express alkalmazás inicializálás
│   └── server.ts              # HTTP szerver indítás
├── .env                       # Környezeti változók (gitignore-ban!)
├── package.json
├── tsconfig.json
├── README.md                  # Részletes API dokumentáció és diagramok
└── handover.md                # Ez a fájl
```

---

## 5. Adatbázis

### Enum-ok

| Enum | Értékek | Leírás |
|:-----|:--------|:-------|
| `Role` | `STUDENT`, `COMPANY_ADMIN`, `MENTOR`, `UNIVERSITY_USER`, `SYSTEM_ADMIN` | Felhasználói szerepkörök |
| `PositionType` | `DUAL`, `PROFESSIONAL_PRACTICE`, `REGULAR_WORK` | Pozíció típusok |
| `ApplicationStatus` | `SUBMITTED`, `ACCEPTED`, `PENDING`, `REJECTED`, `NO_RESPONSE`, `RETRACTED` | Jelentkezési státuszok |
| `PartnershipStatus` | `PENDING_MENTOR`, `PENDING_UNIVERSITY`, `ACTIVE`, `FINISHED`, `TERMINATED` | Partneri kapcsolat státuszok |
| `RegistrationStatus` | `PENDING`, `APPROVED`, `REJECTED` | Cégregisztrációs státuszok |
| `LogStatus` | `DRAFT`, `PENDING`, `APPROVED`, `REJECTED` | Napló státuszok |

### Fő Entitások és Kapcsolataik

| Entitás | Leírás | Fontos mezők |
|:--------|:-------|:-------------|
| **User** | Felhasználói fiókok (minden szerepkör) | `role`, `isActive`, `managedMajors`, `managedCompanies` |
| **StudentProfile** | Hallgatói profil adatok | `majorId`, `isAvailableForWork`, `neptunCode` |
| **Company** | Cég adatok | `status`, `hasOwnApplication`, `externalApplicationUrl` |
| **CompanyEmployee** | Céges munkavállalók/mentorok | `companyId`, `jobTitle` |
| **Position** | Állásajánlatok/pozíciók | `type` (PositionType enum), `externalApplicationUrl`, `deadline` (nullable) |
| **Application** | Jelentkezések | `status`, `studentId`, `positionId` |
| **DualPartnership** | Duális partneri kapcsolatok | `uniEmployeeId` (automatikusan kitöltve), `mentorId`, `status` |
| **Major** | Képzési szakok | `managedBy` (referensek) |
| **Location** | Helyszínek (cégekhez és hallgatókhoz) | `companyId`, `studentProfileId` |
| **Notification** | Értesítések | `type`, `isRead`, `isArchived` |
| **AuditLog** | Biztonsági napló | `action`, `entity`, `details` (JSON) |
| **News** | Hírek/közlemények | `targetGroup`, `isImportant`, `isArchived` |
| **MaterialCompletion** | Tananyag elvégzések | `rating`, `isCompleted` |
| **GalleryGroup / GalleryImage** | Rendszerszintű galéria albumok | S3-on tárolt, optimalizált `.webp` képek |
| **CompanyImage** | Céges galéria képek | S3-on tárolt, céghez kötött |
| **Tag** | Pozíció címkék | `name`, `category` |

### Fontos Kapcsolatok (Több-több)

- **User ↔ Major** (`MajorToUniversityUser`): Referensek és a kezelt szakjaik.
- **User ↔ Company** (`CompanyToUniversityUser`): Referensek és a kezelt cégjeik.
- **Position ↔ Tag**: Pozíciók és címkéik.

### Soft Delete

A rendszer soft delete-et használ a következő entitásokon:
`User`, `StudentProfile`, `CompanyEmployee`, `Company`, `Position`, `Tag`, `Application`, `DualPartnership`, `News`, `Notification`.

A Prisma client automatikusan szűri a `deletedAt` mezőt a `findMany`, `findFirst` és `findUnique` hívásokban (lásd: `src/config/prisma.ts`).

---

## 6. Szerepkörök és Jogosultságok

| Szerepkör | Leírás | Főbb jogosultságok |
|:----------|:-------|:-------------------|
| `STUDENT` | Hallgató | Saját profil, jelentkezések, partnerségek, egyetemi profilra váltás |
| `MENTOR` | Céges munkavállaló/Mentor | Cég pozíciói, mentorált hallgatók |
| `COMPANY_ADMIN` | Cégadminisztrátor | Teljes cégkezelés, jelentkezések értékelése, pozíciók és munkavállalók |
| `UNIVERSITY_USER` | Kari referens | Partnerségek jóváhagyása, hallgatók felügyelete, szakhoz és céghez rendelt dashboard |
| `SYSTEM_ADMIN` | Rendszergazda | Teljes adminisztráció, cégek jóváhagyása, anonimizálás |

### Middleware-ek

| Middleware | Fájl | Funkció |
|:-----------|:-----|:--------|
| `authenticateToken` | `auth.middleware.ts` | JWT token validáció és user context beállítása |
| `requireRole` / `isStudent`, stb. | `auth.middleware.ts` | Szerepkör-alapú jogosultságellenőrzés |
| `validate` | `validate.middleware.ts` | Zod séma validáció (body, query, params) |
| `ownership` | `ownership.middleware.ts` | Erőforrás-tulajdonjog ellenőrzés |
| `idempotency` | `idempotency.middleware.ts` | Dupla küldés elleni védelem |
| `rateLimit` | `rateLimit.middleware.ts` | Rate limiting (auth végpontokon) |
| `sanitization` | `sanitization.middleware.ts` | Input szanálás |
| `upload` | `upload.middleware.ts` | Multer fájlfeltöltés (memória) |

---

## 7. Üzleti Logika - Kulcsfunkciók

### 7.1 Jelentkezés → Partnerség Automatizáció

A legfontosabb üzleti folyamat:

1. **Diák jelentkezik** egy pozícióra (`POST /api/applications`)
2. **Cégadmin elfogadja** a jelentkezést (`PATCH /api/applications/company/:id/evaluate`)
3. **Automatikusan létrejön** a `DualPartnership` (`PENDING_MENTOR` státuszal)
4. **Automatikus referens hozzárendelés**: A rendszer megkeresi a diák szakjához ÉS a cég-hez is rendelt referenst
5. **Cég hozzárendeli a mentort** (`PATCH /api/partnerships/:id/assign-mentor`) → `PENDING_UNIVERSITY`
6. **Egyetemi referens aktiválja** (`PATCH /api/partnerships/:id/assign-university-user`) → `ACTIVE`

**Implementáció**:
- `ApplicationService.evaluate()` → Automatikusan hívja a `universityUserService.findReferentForPartnership()`
- `PartnershipService.assignUniversityUser()` → Fallback: ha nincs uni user megadva, újra próbál keresni

### 7.2 Pozíció Típusrendszer

Az `isDual: boolean` mező **kivezetésre került**. Helyette:

```typescript
enum PositionType {
  DUAL                    // Duális képzési pozíció
  PROFESSIONAL_PRACTICE   // Szakmai gyakorlat
  REGULAR_WORK            // Rendes munkalehetőség
}
```

- A `Position` modell `type` mezője ezt az enum-ot használja
- Szűrés: `GET /api/jobs/positions?type=DUAL`
- Legacy kompatibilitás: `GET /api/jobs/positions/dual` és `/non-dual` továbbra is elérhető

### 7.3 Külső Jelentkezési Linkek

Bizonyos cégek (pl. Mercedes, BMW) saját karrieroldalukat használják jelentkeztetésre:
- `Company.externalApplicationUrl` — Cég szintű külső link
- `Position.externalApplicationUrl` — Pozíció szintű külső link (felülírhatja a cégét)
- Ha a cég `hasOwnApplication: true`, a frontend nem mutatja a belső jelentkezés gombot

### 7.4 Kari Referens Menedzsment

Az egyetemi referensek (UNIVERSITY_USER) hozzárendelhetők szakokhoz és cégekhez:

| Végpont | Funkció |
|:--------|:--------|
| `POST /api/university-users/:id/majors` | Szakok hozzárendelése egy referenshez |
| `POST /api/university-users/:id/companies` | Cégek hozzárendelése egy referenshez |
| `GET /api/university-users/me/assignments` | Saját hozzárendelések lekérése |
| `GET /api/university-users/referents` | Összes aktív referens listázása |
| `GET /api/university-users/potential-referents` | Potenciális referensek listázása hallgató/pozíció alapján |
| `GET /api/stats/university/referent-overview` | Referens dashboard (cégek, diákok, statisztikák) |

**Automatikus hozzárendelés logikája** (`findReferentForPartnership`):
1. Megkeresi a diák `majorId`-ját és a pozíció `companyId`-ját
2. Keres egy aktív referenst, aki MIND a szakhoz, MIND a céghez hozzá van rendelve
3. Ha talál: automatikusan beállítja `DualPartnership.uniEmployeeId`-ba

**Referens Switcher** (`listPotentialReferents`):
- Visszaadja az összes referenst, aki a diák szakjához van rendelve
- `isCompanyMatch: true` jelöléssel megkülönbözteti a céghez is rendelt referenseket
- Lehetővé teszi az admin számára a referens manuális cseréjét

### 7.5 Anonimizáló Rendszer (GDPR)

Központosított `AnonymizeService` a személyes adatok végleges törlésére:

| Metódus | Érintett entitások |
|:--------|:-------------------|
| `anonymizeStudentProfile()` | User, StudentProfile, Location, Application, DualPartnership, Notification |
| `anonymizeCompany()` | Company, Location, Position, CompanyEmployee, User, DualPartnership, Notification |
| `anonymizePosition()` | Position |

Placeholder-alapú implementáció, nulla külső függőség.

### 7.6 Képfeltöltés és Galéria (S3)

- **Képoptimalizálás**: Sharp (C++ libvips) → max 1920px, `.webp` formátum
- **Tárolás**: Supabase S3 bucket
- **Rendszerszintű galéria**: `GalleryGroup` / `GalleryImage` (SystemAdmin kezeli)
- **Cég galéria**: `CompanyImage` (CompanyAdmin kezeli)
- Mindkét galériatípus publikusan elérhető

### 7.7 Email és Háttérfolyamatok

- **Nodemailer** SMTP alapú email küldés (Mailtrap fejlesztéshez)
- **BullMQ** Redis-alapú háttérsor (`email.queue.ts`, `email.worker.ts`)
- Fájlcsatolmányos jelentkezés: GDPR-kompatibilis pass-through (fájl soha nem kerül lemezre)

---

## 8. API Végpont Összefoglaló

A teljes API dokumentáció a Swagger UI-on érhető el: `/api-docs`

### Végpont Csoportok

| Csoport | Prefix | Route fájl | Leírás |
|:--------|:-------|:-----------|:-------|
| Autentikáció | `/api/auth` | `auth.routes.ts` | Regisztráció, login, email verifikáció, jelszó reset |
| Hallgatók | `/api/students` | `student.routes.ts` | Profil, elérhetőség, university transition |
| Cégek | `/api/companies` | `company.routes.ts` | CRUD, státuszkezelés (approve/reject), reakiváció |
| Céges képek | `/api/companies/:id/images` | `companyImage.routes.ts` | Cég galéria kezelés |
| Pozíciók | `/api/jobs` | `job.routes.ts` | CRUD, típusszűrés, deaktiválás |
| Jelentkezések | `/api/applications` | `application.routes.ts` | Leadás, fájlcsatolás, értékelés |
| Partnerségek | `/api/partnerships` | `dual.routes.ts` | Mentor/referens hozzárendelés, státusz átmenetek |
| Egyetemi user-ek | `/api/university-users` | `universityUser.routes.ts` | Referens hozzárendelés, potenciális referensek |
| Cégadminok | `/api/company-admins` | `companyAdmin.routes.ts` | Céges admin kezelés |
| Munkavállalók | `/api/employees` | `employee.routes.ts` | Mentor lista, mentorált hallgatók |
| Rendszeradminok | `/api/system-admins` | `systemAdmin.routes.ts` | Rendszergazda kezelés, Cég/Diák meghívók küldése |
| Felhasználók | `/api/users` | `user.routes.ts` | Aktiválás/deaktiválás (admin) |
| Szakok | `/api/majors` | `major.routes.ts` | Szak CRUD |
| Helyszínek | `/api/locations` | `location.routes.ts` | Céghelyszínek listázása |
| Statisztika | `/api/stats` | `stats.routes.ts` | Dashboard adatok (rendszer, cég, egyetem, referens) |
| Hírek | `/api/news` | `news.routes.ts` | Hír CRUD, archiválás |
| Értesítések | `/api/notifications` | `notification.routes.ts` | CRUD, olvasottnak jelölés, archiválás |
| Tananyagok | `/api/materials` | `material.routes.ts` | Elvégzés rögzítés, statisztikák |
| Galéria | `/api/galleries` | `gallery.routes.ts` | Rendszer galéria albumok |

### Statisztikai Végpontok (részletes)

| Végpont | Leírás | Jogosultság |
|:--------|:-------|:------------|
| `GET /api/stats` | Rendszerszintű áttekintés | SystemAdmin |
| `GET /api/stats/company/me` | Saját cég statisztikái | CompanyAdmin |
| `GET /api/stats/applications` | Jelentkezési statisztikák | SystemAdmin |
| `GET /api/stats/partnerships` | Partneri statisztikák | SystemAdmin |
| `GET /api/stats/positions` | Pozíció statisztikák | SystemAdmin |
| `GET /api/stats/trends` | 6 hónapos trendek | SystemAdmin |
| `GET /api/stats/university/student-distribution` | Hallgatói eloszlás | UniversityUser |
| `GET /api/stats/university/referent-overview` | **Referens dashboard** | UniversityUser |

---

## 9. Biztonsági Funkciók

1. **JWT Token Auth**: Minden védett végpont `Authorization: Bearer <token>` fejlécet igényel
2. **RBAC**: Szerepkör-alapú middleware szűrés minden végponton
3. **Zod Validáció**: Szigorú bemeneti validáció, felesleges mezők automatikus eltávolítása
4. **Ownership Middleware**: Felhasználók csak saját erőforrásaikat módosíthatják
5. **Idempotency**: Kritikus műveletek dupla küldés elleni védelme
6. **Rate Limiting**: Auth végpontok throttle-ja
7. **Magic Bytes**: Feltöltött fájlok valódi tartalmának ellenőrzése
8. **Soft Delete**: Adatok soha nem törlődnek véglegesen (csak `deletedAt` jelölés)
9. **Audit Logging**: Minden kritikus esemény `AuditLog`-ba kerül
10. **GDPR Anonimizálás**: Központosított PII scrubbing

---

## 10. Deployment

### Production (Railway)

- **Platform**: Railway
- **Build**: `npm run build` → `dist/` → `npm start`
- **Adatbázis**: Railway PostgreSQL
- **Redis**: Railway Redis (opcionális)
- **Environment**: Railway Environment Variables

### Migráció

```bash
# Fejlesztéshez
npm run prisma:push

# Production-höz (generál egy migrációs fájlt)
npx prisma migrate dev --name "migration_name"
npx prisma migrate deploy
```

---

## 11. Aktuális Fejlesztési Állapot

### ✅ Befejezett Funkciók
- Teljes autentikációs rendszer (JWT, email verifikáció, jelszó reset)
- Felhasználókezelés (5 szerepkör, profil CRUD)
- Cégek kezelése (regisztráció, jóváhagyás, munkavállalók)
- Pozíciók és állásajánlatok (típusrendszer, szűrés, helyszínek, tag-ek)
- Jelentkezési rendszer (fájlcsatolás, értékelés, automatikus partnerség)
- Duális partnerségi rendszer (státusz átmenetek, mentor/referens hozzárendelés)
- **Rugalmas Pozíció Típus Rendszer**: `isDual` → `type` enum (DUAL, PROFESSIONAL_PRACTICE, REGULAR_WORK)
- **Külső Jelentkezési Linkek**: `externalApplicationUrl` Company/Position szinten
- **Kari Referens Menedzsment**: Szak/cég hozzárendelés, automatikus párosítás, referens választó (switcher)
- **Referens Dashboard**: `GET /api/stats/university/referent-overview`
- Hírkezelés (célzott közönség, archiválás)
- Értesítési rendszer (olvasottnak jelölés, archiválás)
- Tananyag nyilvántartás és értékelés
- Képgaléria rendszer (S3, optimalizálás, rendszer + céges galéria)
- Statisztikai dashboard-ok (rendszer, cég, egyetem, referens szintű)
- GDPR-kompatibilis anonimizáló rendszer
- Biztonsági middleware-ek (ownership, idempotency, rate limiting)
- **Rendszeradmin Meghívók**: Automatikus regisztrációs linkek küldése e-mailben (cégek és diákok számára)

### 🔄 Fejlesztés Alatt / Tervezett
- Részletes keresés és szűrés bővítése (város, kategória, kulcsszó)
- Push értesítések (WebSocket / FCM)
- Exportálási funkciók (PDF, CSV)
- Automatizált integrációs tesztek bővítése

---

## 12. Ismert Gotcha-k és Technikai Megjegyzések

1. **Prisma Soft Delete Extension**: A `src/config/prisma.ts` fájl egy custom Prisma extension-t tartalmaz, ami automatikusan szűri a `deletedAt` mezőt. Ha explicit módon szeretnél törölt rekordokat is lekérdezni, a nyers Prisma client-et kell használni (`basePrisma`).

2. **Composite Unique Key kezelés**: A soft delete extension `findUnique` override-ja flatten-eli a composite key-eket (pl. `studentId_positionId`) a `findFirst` kompatibilitás miatt.

3. **PositionType migráció**: A korábbi `isDual: boolean` mező kivezetésre került. Ha régi adatok vannak az adatbázisban, azokat manuálisan kell migrálni a `type` enum értékekre.

4. **Referens automatikus hozzárendelés**: Ha nincs megfelelő referens (major + company párosítás), a `uniEmployeeId` `null` marad – a rendszeradmin manuálisan rendeli hozzá.

5. **Fájlfeltöltés**: A CV és motivációs levél fájlok **soha nem kerülnek lemezre** – memóriában maradnak, emailben továbbítódnak, majd a GC törli őket (GDPR).

6. **Express v5**: A projekt Express 5-öt használ, nem v4-et. Ügyelj az async error handling különbségekre.

---

## 13. Tesztelés

### Verifikációs Szkript

A `scripts/verify_features.ts` szkript a teljes üzleti logikát végigpróbálja:
1. Tesztadatok létrehozása (szak, diák, cég, helyszín, admin, referens)
2. Pozíció létrehozása (típusrendszer tesztje)
3. Jelentkezés leadása és elfogadása
4. Automatikus referens hozzárendelés ellenőrzése
5. Referens dashboard ellenőrzése
6. Potenciális referensek (switcher) ellenőrzése

### Takarítás

A `scripts/cleanup_test_data.ts` szkript a tesztadatokat FK-kényszereket figyelembe véve, helyes sorrendben törli:
1. DualPartnership → Application → Position → Location → CompanyEmployee
2. StudentProfile → Company → Major → User

### Futtatás

```bash
# Teszt futtatása (létrehozza az adatokat, ellenőriz, utána takarít)
npx tsx scripts/verify_features.ts; npx tsx scripts/cleanup_test_data.ts
```

---

## 14. Frontend Integrációs Útmutató

### Pozíció Típus (isDual → type)
- **Régi**: `isDual: boolean` → **Új**: `type: "DUAL" | "PROFESSIONAL_PRACTICE" | "REGULAR_WORK"`
- Szűrés: `GET /api/jobs/positions?type=DUAL`
- Megjelenítés: Legördülő menü / választógombok a checkbox helyett

### Külső Jelentkezés
- Ha `Company.hasOwnApplication === true` és van `externalApplicationUrl`: a "Jelentkezés" gomb navigáljon a külső URL-re
- Ha `Position.externalApplicationUrl` is létezik: az felülírja a cégszintű linket

### Határidő
- A `deadline` mező lehet `null` → "Folyamatos jelentkezés" felirat

### Referens Dashboard
- `GET /api/stats/university/referent-overview` → Dedikált felület a referenseknek
- A referens választó legördülőben a `isCompanyMatch: true` jelöléssel rendelkezők az "ajánlott" kategóriába kerüljenek

---

> **Megjegyzés**: Ez a dokumentáció a projekt 2026-04-15-i állapotát tükrözi. A teljes API specifikáció a Swagger UI-on (`/api-docs`) érhető el.