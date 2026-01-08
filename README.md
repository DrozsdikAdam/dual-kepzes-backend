# Duális Képzés Backend API

Ez a repository tartalmazza a Duális Képzés rendszer backend API-ját. Az alkalmazás Node.js környezetben, Express keretrendszerrel, TypeScript nyelven íródott, PostgreSQL adatbázist használ Prisma ORM-mel, és Zod könyvtárat a validációhoz.

## Technológiai Stack

*   **Runtime:** Node.js
*   **Nyelv:** TypeScript
*   **Keretrendszer:** Express.js
*   **Adatbázis:** PostgreSQL
*   **ORM:** Prisma
*   **Validáció:** Zod
*   **Autentikáció:** JWT (JSON Web Token) + bcryptjs
*   **Biztonság:** Helmet, Cors, Rate Limiting

## Telepítés és Konfiguráció

Kövesd az alábbi lépéseket a fejlesztői környezet beállításához.

### Repository klónozása

```bash
git clone https://github.com/DrozsdikAdam/dual-kepzes-backend
cd dual-kepzes-backend
npm install
```

### Környezeti Változók (.env)

Hozd létre a `.env` fájlt a gyökérkönyvtárban az alábbi tartalommal:

```env
# Szerver konfiguráció
PORT=3000

# Adatbázis kapcsolat (PostgreSQL connection string)
DATABASE_URL="postgresql://felhasznalo:jelszo@localhost:5432/adatbazis_neve?schema=public"

# Ha Supabase-t vagy tranzakciós poolert használsz (Opcionális)
DIRECT_URL="postgresql://felhasznalo:jelszo@localhost:5432/adatbazis_neve?schema=public"

# JWT Titkos kulcs (Aláíráshoz)
JWT_SECRET="ide_irj_egy_eros_titkos_kulcsot"

# Környezet (development / production)
NODE_ENV="development"
```

## Biztonság és Middleware-ek

Az alkalmazás több rétegű védelmet használ a támadások ellen és a stabil működés érdekében.

### 1. Rate Limiting (Forgalomkorlátozás)

A `rateLimitMiddleware.ts` alapján kétféle korlátozás van érvényben a túlterheléses támadások (DDoS) és a brute-force próbálkozások ellen:

*   **Autentikációs végpontok (`/api/auth/*`):** Szigorú limit.
    *   Időablak: 15 perc.
    *   Maximum kérés: 5 db / IP.
    *   Cél: Jelszófeltörés megakadályozása.
*   **Általános API végpontok (`/api/*`):** Enyhébb limit.
    *   Időablak: 10 perc.
    *   Maximum kérés: 100 db / IP.

### 2. HTTP Header Biztonság

A `helmet` middleware gondoskodik a biztonsági HTTP fejlécek (pl. X-XSS-Protection, Strict-Transport-Security) beállításáról.

### 3. Jogosultságkezelés (RBAC)

Az `authMiddleware.ts` biztosítja a szerepkör alapú hozzáférést.

*   `authenticateToken`: Ellenőrzi a JWT érvényességét.
*   `requireRole`: Middleware gyár, amely ellenőrzi, hogy a felhasználó rendelkezik-e a szükséges szerepkörrel (pl. `isStudent`, `isMentor`, `isStaff`).

## Autentikáció

A rendszer robusztus regisztrációs és bejelentkezési folyamattal rendelkezik.

### Regisztráció (`POST /api/auth/register`)

A regisztráció során a rendszer adatbázis tranzakciót használ. Ez biztosítja, hogy a `User` (alapadatok) és a szerepkör-specifikus profil (pl. `StudentProfile`, `CompanyEmployee`) egyszerre jöjjön létre.

*   **Validáció:** Zod séma ellenőrzi a jelszó erősségét és a kötelező mezőket.
*   **Email ellenőrzés:** Egyedi email cím kényszerítése.
*   **Jelszó:** Bcrypt hashelés.

### Bejelentkezés (`POST /api/auth/login`)

Sikeres azonosítás esetén a rendszer JWT tokent állít ki, amely tartalmazza a felhasználó azonosítóját (`userId`) és szerepkörét (`role`).

## API Modulok

### 1. Hallgatói Modul (`/api/students`)

A hallgatók kezelése, profilmódosítás és törlés.

| Metódus | Végpont | Leírás | Jogosultság |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Összes hallgató listázása (csak aktívak). | Staff |
| `GET` | `/me` | Saját profil lekérése. | Student |
| `PUT` | `/me` | Saját profil frissítése. | Student |
| `DELETE` | `/me` | Saját profil törlése (Soft Delete). | Student |
| `GET` | `/:id` | Hallgató lekérése ID alapján. | Staff |
| `PUT` | `/:id` | Hallgató módosítása ID alapján. | Staff |
| `DELETE` | `/:id` | Hallgató törlése ID alapján (Soft Delete). | Staff |

**Kiemelt logikák:**

*   **Nested Update:** A `PUT` kérések egyszerre frissítik a `User` táblát (név, telefon) és a kapcsolódó `StudentProfile` táblát (cím, iskola, stb.) egy tranzakcióban.
*   **Soft Delete:** A törlés nem távolítja el fizikailag az adatot, hanem beállítja a `deletedAt` dátumot és az `isActive: false` flaget. A lekérdezések (pl. `findUnique`, `findMany`) automatikusan szűrik a törölt elemeket (`deletedAt: null`).

### 2. Állásportál Modul (`/api/jobs`)

Cégek és álláshirdetések (pozíciók) kezelése.

#### Cégek (`/api/jobs/companies`)

| Metódus | Végpont | Leírás | Validáció |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Cégek listázása + nyitott pozíciók száma (`_count`). | Authenticated |
| `GET` | `/:id` | Cég részletei, pozíciók és kapcsolattartók. | Authenticated |
| `POST` | `/` | Új cég létrehozása. | `CompanyCreateSchema` |
| `PUT` | `/:id` | Cég adatainak frissítése. | `CompanyUpdateSchema` |
| `DELETE` | `/:id` | Cég törlése (Soft Delete). | Authenticated |

**Különleges logika:**

*   **Adószám ellenőrzés:** Létrehozáskor a rendszer ellenőrzi, hogy létezik-e már cég a megadott adószámmal (`taxId`).
*   **Kaszkádolt törlés (Logikai):** Ha egy céget törölnek (`deleteCompany`), a rendszer automatikusan inaktiválja (`isActive: false`) és töröltnek jelöli (`deletedAt: new Date()`) a hozzá tartozó összes pozíciót is.

#### Pozíciók (`/api/jobs/positions`)

| Metódus | Végpont | Leírás | Validáció |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Aktív pozíciók listázása (határidő szerint rendezve). | Authenticated |
| `GET` | `/:id` | Pozíció részletei + Címkék (Tags). | Authenticated |
| `POST` | `/` | Új pozíció meghirdetése. | `PositionCreateSchema` |
| `PUT` | `/:id` | Pozíció frissítése. | `PositionUpdateSchema` |
| `DELETE` | `/:id` | Pozíció törlése. | Authenticated |

**Címke (Tag) Kezelés:**

*   **Automatikus formázás:** A Zod séma a beérkező címkéket automatikusan formázza (pl. "javaScript" -> "Javascript").
*   **ConnectOrCreate:** A Prisma `connectOrCreate` funkcióját használjuk. Ha a címke (pl. "React") már létezik az adatbázisban, hozzákapcsolja a pozícióhoz. Ha nem, akkor létrehozza az új címkét és úgy kapcsolja hozzá.

## Validáció (Zod)

A beérkező adatok szigorú típus- és formátumellenőrzésen esnek át a `validate` middleware segítségével.

*   **Adószám:** Fix karakterhosszúság és formátum.
*   **Dátumok:** Automatikus konverzió stringből Date objektummá (`z.coerce.date()`).
*   **Email:** Szabványos email formátum validáció.
*   **Címkék:** Üres szóközök levágása (trim), tömbkezelés.
*   **Update Sémák:** A `partial()` metódus használatával a frissítésnél nem kötelező minden mezőt elküldeni, csak azt, ami változik.

## Hibakezelés

Az alkalmazás központosított hibakezelést használ (`errorMiddleware.ts`).
Minden hiba (legyen az adatbázis, validációs vagy egyéb szerverhiba) egységes JSON formátumban tér vissza a klienshez:

```json
{
  "status": "error",
  "message": "Validációs hiba",
  "errors": [
    {
      "field": "email",
      "message": "Érvénytelen email cím formátum"
    }
  ],
  "stack": "..." // Csak development módban
}