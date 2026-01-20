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

*   `authenticateToken`: Ellenőrzi a JWT érvényességét, valamint az adatbázisban ellenőrzi, hogy a felhasználó létezik-e, aktív-e (`isActive: true`) és nincs-e törölve (`deletedAt: null`).
*   `requireRole`: Middleware gyár, amely ellenőrzi, hogy a felhasználó rendelkezik-e a szükséges szerepkörrel (pl. `isStudent`, `isMentor`, `isStaff`).

## Autentikáció

A rendszer robusztus regisztrációs és bejelentkezési folyamattal rendelkezik.

### Regisztráció (`POST /api/auth/register`)

A regisztráció során a rendszer adatbázis tranzakciót használ. Ez biztosítja, hogy a `User` (alapadatok) és a szerepkör-specifikus profil (pl. `StudentProfile`, `CompanyEmployee`) egyszerre jöjjön létre.

*   **Validáció:** Zod séma ellenőrzi a jelszó erősségét és a kötelező mezőket.
*   **Szerepkör validáció:** Mentor és Cégadminisztrátor regisztrációjakor kötelező a `companyId` megadása.
*   **Email ellenőrzés:** Egyedi email cím kényszerítése.
*   **Jelszó:** Bcrypt hashelés.

### Bejelentkezés (`POST /api/auth/login`)

Sikeres azonosítás esetén a rendszer JWT tokent állít ki, amely tartalmazza a felhasználó azonosítóját (`userId`) és szerepkörét (`role`).

## API Modulok

A végpontok logikai modulokra vannak bontva. Zárójelben a bázis útvonal található.

### 1. Hallgatói Modul (`/api/students`)

A hallgatók kezelése, profilmódosítás és törlés.

| Metódus | Végpont | Leírás | Jogosultság |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Összes hallgató listázása. | Authenticated |
| `GET` | `/me` | Saját profil lekérése. | Student |
| `PUT` | `/me` | Saját profil frissítése. | Student |
| `DELETE` | `/me` | Saját profil törlése (Soft Delete). | Student |
| `GET` | `/:id` | Hallgató lekérése ID alapján. | Authenticated |
| `PUT` | `/:id` | Hallgató módosítása ID alapján. | Authenticated |
| `DELETE` | `/:id` | Hallgató törlése ID alapján (Soft Delete). | Authenticated |

### 2. Cég Modul (`/api/companies`)

Cégek teljes körű kezelése (CRUD), státuszmenedzsment és több telephely támogatása.

| Metódus | Végpont | Leírás | Jogosultság |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Összes cég listázása. | Authenticated |
| `POST` | `/` | Új cég létrehozása. | Authenticated |
| `GET` | `/inactive` | Inaktív (`isActive: false`) cégek listázása. | Authenticated |
| `GET` | `/:id` | Cég részletei. | Authenticated |
| `PATCH` | `/:id` | Cég adatainak frissítése. | Authenticated |
| `DELETE` | `/:id` | Cég törlése (Soft Delete). | Authenticated |
| `PATCH` | `/:id/reactivate` | Cég újraaktiválása (`isActive: true`). | Authenticated |
| `PATCH` | `/:id/deactivate` | Cég inaktiválása (`isActive: false`). | Authenticated |

### 3. Állásportál Modul (`/api/jobs`)

Pozíciók (álláshirdetések) kezelése. A végpontok a `/positions` alútvonalon érhetőek el. A rendszer támogatja a nemzetközi munkavégzési helyszíneket is (opcionális ország mező).

| Metódus | Végpont | Leírás | Jogosultság |
| :--- | :--- | :--- | :--- |
| `GET` | `/positions` | Aktív pozíciók listázása. | Authenticated |
| `GET` | `/positions/company/:companyId` | Adott cég pozícióinak listázása. | Authenticated |
| `POST` | `/positions` | Új pozíció meghirdetése. | Authenticated |
| `GET` | `/positions/:id` | Pozíció részletei. | Authenticated |
| `PATCH` | `/positions/:id` | Pozíció frissítése. | Authenticated |
| `DELETE` | `/positions/:id` | Pozíció törlése (Soft Delete). | Authenticated |
| `PATCH` | `/positions/:id/deactivate` | Pozíció inaktiválása. | Authenticated |

### 4. Munkavállalói Modul (`/api/employees`)

A cégek munkavállalóinak (pl. mentorok, kapcsolattartók) kezelése.

| Metódus | Végpont | Leírás | Jogosultság |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Céghez tartozó munkavállalók listázása. | Authenticated |
| `GET` | `/me` | Saját profil lekérése. | Authenticated |
| `PUT` | `/me` | Saját profil frissítése. | Authenticated |
| `DELETE` | `/me` | Saját profil törlése. | Authenticated |
| `GET` | `/:id` | Munkavállaló lekérése ID alapján. | Authenticated |
| `PUT` | `/:id` | Munkavállaló frissítése. | Authenticated |
| `DELETE` | `/:id` | Munkavállaló törlése. | Authenticated |

### 5. Jelentkezés Modul (`/api/applications`)

A hallgatók jelentkezéseinek kezelése a pozíciókra.

| Metódus | Végpont | Leírás | Jogosultság |
| :--- | :--- | :--- | :--- |
| `POST` | `/` | Jelentkezés egy pozícióra. | Student |
| `GET` | `/` | Saját jelentkezések listázása. | Student |
| `PATCH` | `/:id/retract` | Jelentkezés visszavonása. | Student |
| `GET` | `/company` | Céghez érkezett jelentkezések listázása. | Company Employee |
| `PATCH` | `/company/:id` | Értékelés frissítése. | Company Employee |
| `PATCH` | `/company/:id/evaluate` | Jelentkezés értékelése. | Company Employee |
| `GET` | `/admin` | Összes jelentkezés listázása. | System Admin |
| `GET` | `/admin/:id` | Jelentkezés részletei. | System Admin |
| `PATCH` | `/admin/:id` | Jelentkezés adminisztrátori módosítása. | System Admin |

### 6. Statisztika Modul (`/api/stats`)

Rendszerszintű statisztikák.

| Metódus | Végpont | Leírás | Jogosultság |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Rendszer statisztikák lekérése. | Authenticated |

### 7. Hírek Modul (`/api/news`)

Hírek és közlemények kezelése. A felhasználók csak a rájuk vonatkozó aktív híreket látják.

| Metódus | Végpont | Leírás | Jogosultság |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Aktív, releváns hírek listázása. | Authenticated |
| `GET` | `/:id` | Hír részletei. | Authenticated |
| `POST` | `/admin` | Új hír létrehozása. | System Admin |
| `GET` | `/admin` | Összes hír listázása (admin nézet). | System Admin |
| `GET` | `/admin/archived` | Archivált hírek listázása. | System Admin |
| `GET` | `/admin/:id` | Hír részletei (admin nézet). | System Admin |
| `PATCH` | `/admin/:id` | Hír módosítása. | System Admin |
| `PATCH` | `/admin/:id/archive` | Hír archiválása. | System Admin |
| `PATCH` | `/admin/:id/unarchive` | Hír visszavonása az archívumból. | System Admin |
| `DELETE` | `/admin/:id` | Hír törlése (Soft Delete). | System Admin |

### 8. Adminisztrációs Modulok

A rendszer adminisztrátori szintjei.

#### Rendszer Adminisztrátorok (`/api/system-admins`)

| Metódus | Végpont | Leírás | Jogosultság |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Összes rendszeradmin listázása. | Authenticated |
| `GET` | `/me` | Saját admin profil lekérése. | Authenticated |
| `PATCH` | `/me` | Saját admin profil frissítése. | Authenticated |
| `DELETE` | `/me` | Saját admin profil törlése. | Authenticated |
| `GET` | `/:id` | Rendszeradmin lekérése ID alapján. | Authenticated |
| `PATCH` | `/:id` | Adatok frissítése. | Authenticated |
| `DELETE` | `/:id` | Admin törlése. | Authenticated |

#### Cég Adminisztrátorok (`/api/company-admins`)

| Metódus | Végpont | Leírás | Jogosultság |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Összes cégadmin listázása. | Authenticated |
| `GET` | `/me` | Saját profil lekérése. | Authenticated |
| `PATCH` | `/me` | Saját profil frissítése. | Authenticated |
| `DELETE` | `/me` | Saját profil törlése. | Authenticated |
| `GET` | `/:id` | Cégadmin lekérése ID alapján. | Authenticated |
| `PATCH` | `/:id` | Adatok frissítése. | Authenticated |
| `DELETE` | `/:id` | Cégadmin törlése. | Authenticated |

#### Egyetemi Felhasználók (`/api/university-users`)

| Metódus | Végpont | Leírás | Jogosultság |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Összes egyetemi felhasználó listázása. | Authenticated |
| `GET` | `/me` | Saját profil lekérése. | Authenticated |
| `PATCH` | `/me` | Saját profil frissítése. | Authenticated |
| `DELETE` | `/me` | Saját profil törlése. | Authenticated |
| `GET` | `/:id` | Egyetemi felhasználó lekérése ID alapján. | Authenticated |
| `PATCH` | `/:id` | Adatok frissítése. | Authenticated |
| `DELETE` | `/:id` | Törlés. | Authenticated |

### 9. Egyéb Modulok

#### Felhasználók (`/api/users`)

Általános felhasználókezelés és inaktív fiókok adminisztrációja.

| Metódus | Végpont | Leírás | Jogosultság |
| :--- | :--- | :--- | :--- |
| `GET` | `/inactive` | Inaktív (`isActive: false`, `deletedAt: null`) felhasználók listázása. | Authenticated |
| `PATCH` | `/:id/reactivate` | Felhasználó újraaktiválása (`isActive: true`). | Authenticated |
| `PATCH` | `/:id/deactivate` | Felhasználó inaktiválása (`isActive: false`). | Authenticated |

## Validáció (Zod)

A beérkező adatok szigorú típus- és formátumellenőrzésen esnek át a `validate` middleware segítségével.
*   **Formátum:** Email címek, URL-ek, Dátumok és Irányítószámok (4 számjegyű magyar formátum) ellenőrzése.
*   **Biztonság:** Jelszóerősség (min. 12 karakter, vegyes karaktertípusok) kikényszerítése.

## Hibakezelés

Az alkalmazás központosított hibakezelést használ (`errorMiddleware.ts`).
Minden hiba egységes JSON formátumban tér vissza.