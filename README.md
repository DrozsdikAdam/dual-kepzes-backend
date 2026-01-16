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

### 2. Állásportál Modul (`/api/jobs`)

Cégek és álláshirdetések (pozíciók) kezelése.

#### Cégek (`/api/jobs/companies`)

| Metódus | Végpont | Leírás | Jogosultság |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Cégek listázása. | Authenticated |
| `GET` | `/:id` | Cég részletei, pozíciók és kapcsolattartók. | Authenticated |
| `POST` | `/` | Új cég létrehozása. | Authenticated |
| `PUT` | `/:id` | Cég adatainak frissítése. | Authenticated |
| `DELETE` | `/:id` | Cég törlése (Soft Delete). | Authenticated |

#### Pozíciók (`/api/jobs/positions`)

| Metódus | Végpont | Leírás | Jogosultság |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Aktív pozíciók listázása. | Authenticated |
| `GET` | `/:id` | Pozíció részletei. | Authenticated |
| `POST` | `/` | Új pozíció meghirdetése. | Authenticated |
| `PUT` | `/:id` | Pozíció frissítése. | Authenticated |
| `DELETE` | `/:id` | Pozíció törlése (Soft Delete). | Authenticated |
| `PATCH` | `/:id/deactivate` | Pozíció inaktiválása (isActive=false, nem törlés). | Authenticated |

#### Munkavállalók (`/api/employees`)

A cégek munkavállalóinak kezelése. A cégadminisztrátorok kezelhetik a cégükhöz tartozó munkavállalókat.

| Metódus | Végpont | Leírás | Jogosultság |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Céghez tartozó munkavállalók listázása. | Company Admin |
| `GET` | `/me` | Saját profil lekérése. | Authenticated |
| `PUT` | `/me` | Saját profil frissítése. | Authenticated |
| `DELETE` | `/me` | Saját profil törlése. | Authenticated |
| `GET` | `/:id` | Munkavállaló lekérése ID alapján. | Authenticated |
| `PUT` | `/:id` | Munkavállaló frissítése. | Admin / Self |
| `DELETE` | `/:id` | Munkavállaló törlése. | Admin |

### 3. Adminisztrációs Modulok

A rendszer három fő adminisztrációs szintet különböztet meg, mindegyik saját végpontokkal és jogosultságokkal rendelkezik.

#### Rendszer Adminisztrátorok (`/api/system-admins`)

A legmagasabb szintű jogosultság. A rendszeradminok felelnek a teljes platform karbantartásáért, felhasználók kezeléséért és a rendszer szintű beállításokért. Képesek bármely felhasználó adatait módosítani vagy törölni.

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

A cégek képviselői, akik jogosultak a saját cégük adatainak szerkesztésére, új pozíciók létrehozására és a hozzájuk jelentkező hallgatók kezelésére. Ők felelnek a cégük munkavállalóinak (Mentorok) adminisztrációjáért is.

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

Az egyetem adminisztratív munkatársai. Feladatuk a hallgatók és a duális képzési folyamatok felügyelete, valamint az egyetem és a partnerek közötti kapcsolattartás támogatása.

| Metódus | Végpont | Leírás | Jogosultság |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Összes egyetemi felhasználó listázása. | Authenticated |
| `GET` | `/me` | Saját profil lekérése. | Authenticated |
| `PATCH` | `/me` | Saját profil frissítése. | Authenticated |
| `DELETE` | `/me` | Saját profil törlése. | Authenticated |
| `GET` | `/:id` | Egyetemi felhasználó lekérése ID alapján. | Authenticated |
| `PATCH` | `/:id` | Adatok frissítése. | Authenticated |
| `DELETE` | `/:id` | Törlés. | Authenticated |

### 4. Általános és Inaktív Kezelés (User / Company)

Speciális végpontok az inaktív, de nem törölt státuszú elemek kezelésére.

#### Felhasználók (`/api/users`)

Ez a modul általános felhasználói műveleteket tesz lehetővé, amelyek nem kötődnek specifikusan egy szerepkörhöz. Kiemelt funkciója az inaktív felhasználók kezelése: lehetőséget biztosít olyan fiókok listázására és újraaktiválására, amelyek `isActive: false` státuszúak, de még nem kerültek törlésre (`deletedAt: null`).

| Metódus | Végpont | Leírás | Jogosultság |
| :--- | :--- | :--- | :--- |
| `GET` | `/inactive` | Inaktív (`isActive: false`, `deletedAt: null`) felhasználók listázása. | Authenticated |
| `PATCH` | `/:id/reactivate` | Felhasználó újraaktiválása (`isActive: true`). | Authenticated |
| `PATCH` | `/:id/deactivate` | Felhasználó inaktiválása (`isActive: false`). | Authenticated |

#### Cégek (`/api/companies`)

Hasonlóan a felhasználókhoz, ez a modul a cégek adminisztrációját segíti. Lehetővé teszi a cégek státuszának módosítását (deaktiválás/aktiválás) anélkül, hogy véglegesen törölni kellene az adatokat. Ez hasznos lehet például, ha egy cég ideiglenesen felfüggeszti a duális képzést.

| Metódus | Végpont | Leírás | Jogosultság |
| :--- | :--- | :--- | :--- |
| `GET` | `/inactive` | Inaktív (`isActive: false`, `deletedAt: null`) cégek listázása. | Authenticated |
| `PATCH` | `/:id/reactivate` | Cég újraaktiválása (`isActive: true`). | Authenticated |
| `PATCH` | `/:id/deactivate` | Cég inaktiválása (`isActive: false`). | Authenticated |

## Validáció (Zod)

A beérkező adatok szigorú típus- és formátumellenőrzésen esnek át a `validate` middleware segítségével.

## Hibakezelés

Az alkalmazás központosított hibakezelést használ (`errorMiddleware.ts`).
Minden hiba egységes JSON formátumban tér vissza.